import { Application } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Credit Jambo Savings API',
      version: '1.0.0',
      description: 'API documentation for the Credit Jambo Savings Management System',
      contact: {
        name: 'Credit Jambo Ltd',
        email: 'hello@creditjambo.com',
        url: '#',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server',
      },
      {
        url: '#',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'User ID',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email',
            },
            name: {
              type: 'string',
              description: 'User name',
            },
            role: {
              type: 'string',
              enum: ['CUSTOMER', 'ADMIN'],
              description: 'User role',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'User last update timestamp',
            },
          },
        },
        Device: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Device ID',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'Associated user ID',
            },
            verified: {
              type: 'boolean',
              description: 'Device verification status',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Device creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Device last update timestamp',
            },
          },
        },
        Account: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Account ID',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'Associated user ID',
            },
            balance: {
              type: 'number',
              format: 'float',
              description: 'Account balance',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account last update timestamp',
            },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Transaction ID',
            },
            accountId: {
              type: 'string',
              format: 'uuid',
              description: 'Associated account ID',
            },
            type: {
              type: 'string',
              enum: ['DEPOSIT', 'WITHDRAW'],
              description: 'Transaction type',
            },
            amount: {
              type: 'number',
              format: 'float',
              description: 'Transaction amount',
            },
            description: {
              type: 'string',
              description: 'Transaction description',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Transaction creation timestamp',
            },
          },
        },
        TokenResponse: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              description: 'JWT access token',
            },
            refreshToken: {
              type: 'string',
              description: 'JWT refresh token',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error',
            },
            message: {
              type: 'string',
              description: 'Error message',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
              },
              description: 'Validation errors (if any)',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/dtos/*.ts',
  ],
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Application): void {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs));
  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
}