import { Request, Response } from 'express';
import pushService from '@/services/push.service';
import { SavePushTokenInput, DeletePushTokenInput } from '@/dtos/push.dto';

export class PushController {
  async savePushToken(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
      return;
    }

    const data: SavePushTokenInput = req.body;

    const result = await pushService.savePushToken(req.user.userId, data);

    res.status(200).json({
      status: 'success',
      message: result.message,
    });
  }

  async deletePushToken(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
      return;
    }

    const { token } = req.body as DeletePushTokenInput;

    const result = await pushService.deletePushToken(req.user.userId, token);

    res.status(200).json({
      status: 'success',
      message: result.message,
    });
  }

  async getPushTokens(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
      return;
    }

    const result = await pushService.getUserPushTokens(req.user.userId);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  }
}

export default new PushController();
