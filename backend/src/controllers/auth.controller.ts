import { Request, Response } from 'express';
import authService from '@/services/auth.service';
import { RegisterUserInput } from '@/dtos/user.dto';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    const data: RegisterUserInput = req.body;
    const result = await authService.registerUser(data);

    res.status(201).json({
      status: 'success',
      message: result.message,
      data: {
        user: result.user,
        device: result.device,
        devicePending: result.devicePending,
      },
    });
  }
}

export default new AuthController();
