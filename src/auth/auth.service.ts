import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  private googleClient = new OAuth2Client();

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async loginWithGoogle(credential: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Token Google không hợp lệ');
      }

      const { email, picture } = payload;
      if (!email) {
        throw new UnauthorizedException('Không thể lấy email từ Google');
      }

      const emailLower = email.toLowerCase();

      // Tìm user theo email trong database
      let user = await this.prisma.user.findFirst({
        where: { email: emailLower },
      });

      // Nếu không tìm thấy bằng email, thử tìm bằng username (nếu username trùng email)
      if (!user) {
        user = await this.prisma.user.findUnique({
          where: { username: emailLower },
        });
      }

      // Nếu vẫn không tìm thấy trong database, kiểm tra danh sách ADMIN_EMAILS ở env
      if (!user) {
        const adminEmailsEnv = process.env.ADMIN_EMAILS || '';
        const adminEmails = adminEmailsEnv
          .split(',')
          .map((e) => e.trim().toLowerCase());

        if (!adminEmails.includes(emailLower)) {
          throw new UnauthorizedException(
            'Email này không có quyền truy cập hệ thống',
          );
        }

        const emailPrefix = emailLower.split('@')[0];
        let candidateUsername = emailPrefix;
        let isUnique = false;
        let counter = 0;

        while (!isUnique) {
          const existing = await this.prisma.user.findUnique({
            where: { username: candidateUsername },
          });
          if (!existing) {
            isUnique = true;
          } else {
            counter++;
            candidateUsername = `${emailPrefix}${counter}`;
          }
        }

        user = await this.prisma.user.create({
          data: {
            username: candidateUsername,
            email: emailLower,
            avatar: picture || null,
          },
        });
      } else {
        // Nếu user đã tồn tại, cập nhật email và avatar từ Google nếu có thay đổi
        const updateData: any = {};
        if (!user.email) {
          updateData.email = emailLower;
        }
        if (user.avatar !== picture) {
          updateData.avatar = picture || user.avatar;
        }

        if (Object.keys(updateData).length > 0) {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: updateData,
          });
        }
      }

      const jwtPayload = {
        sub: user.id,
        username: user.username,
        avatar: user.avatar,
      };
      return {
        access_token: await this.jwtService.signAsync(jwtPayload),
      };
    } catch (error: any) {
      throw new UnauthorizedException(
        error.message || 'Xác thực Google thất bại',
      );
    }
  }
}
