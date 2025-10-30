import { Request, Response } from 'express';
import adminService from '@/services/admin.service';

export class AdminController {
  async getDevices(req: Request, res: Response): Promise<void> {
    const filter = (req.query.filter as 'verified' | 'unverified' | 'all') || 'all';

    const result = await adminService.getAllDevices(filter);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  }

  async getUnverifiedDevices(req: Request, res: Response): Promise<void> {
    const result = await adminService.getUnverifiedDevices();

    res.status(200).json({
      status: 'success',
      data: result,
    });
  }

  async verifyDevice(req: Request, res: Response): Promise<void> {
    const { deviceId } = req.params;

    if (!deviceId) {
      res.status(400).json({
        status: 'error',
        message: 'Device ID is required',
      });
      return;
    }

    const result = await adminService.verifyDevice(deviceId);

    res.status(200).json({
      status: 'success',
      message: result.message,
      data: result.device,
    });
  }

  async unverifyDevice(req: Request, res: Response): Promise<void> {
    const { deviceId } = req.params;

    if (!deviceId) {
      res.status(400).json({
        status: 'error',
        message: 'Device ID is required',
      });
      return;
    }

    const result = await adminService.unverifyDevice(deviceId);

    res.status(200).json({
      status: 'success',
      message: result.message,
      data: result.device,
    });
  }

  async getCustomers(req: Request, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;

    const result = await adminService.getAllCustomers(page, limit, search);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  }

  async getCustomerDetails(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({
        status: 'error',
        message: 'User ID is required',
      });
      return;
    }

    const result = await adminService.getCustomerDetails(userId);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  }

  async getTransactions(req: Request, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const filters = {
      userId: req.query.userId as string,
      type: req.query.type as 'DEPOSIT' | 'WITHDRAW',
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };

    const result = await adminService.getAllTransactions(page, limit, filters);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  }

  async getAnalytics(req: Request, res: Response): Promise<void> {
    const result = await adminService.getDashboardAnalytics();

    res.status(200).json({
      status: 'success',
      data: result,
    });
  }
}

export default new AdminController();
