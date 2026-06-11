import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google')
  async loginWithGoogle(@Body() body: { credential: string }) {
    return this.authService.loginWithGoogle(body.credential);
  }
}

