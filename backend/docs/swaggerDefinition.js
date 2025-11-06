module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'Compliance Analytics API',
    version: '1.0.0',
    description:
      'Internal gateway for dynamically configured procedures and upstream authentication.\n\nAll secured endpoints require a bearer token issued by the Login API.',
  },
  servers: [
    {
      url: 'http://localhost:{port}',
      description: 'Local development server',
      variables: {
        port: {
          default: '3002',
        },
      },
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and token issuance',
    },
    {
      name: 'API Definitions',
      description: 'Manage metadata for dynamic stored procedure execution',
    },
    {
      name: 'Execution',
      description: 'Invoke stored procedures through generic API facade',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ApiMetadata: {
        type: 'object',
        required: ['ProjectName', 'ModuleName'],
        properties: {
          ProjectName: {
            type: 'string',
            example: 'Compliance',
          },
          ModuleName: {
            type: 'string',
            example: 'Reports',
          },
          FunctionName: {
            type: 'string',
            example: 'GetMonthlySummary',
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['api', 'data'],
        properties: {
          api: {
            $ref: '#/components/schemas/ApiMetadata',
          },
          data: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: {
                type: 'string',
                format: 'email',
                example: 'user@example.com',
              },
              password: {
                type: 'string',
                example: 'P@ssw0rd',
              },
            },
          },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
          },
          token: {
            type: 'string',
            description: 'JWT token issued by the service',
          },
          expiresIn: {
            type: 'string',
            example: '24h',
          },
          project: {
            type: 'string',
          },
          module: {
            type: 'string',
          },
          upstreamResponse: {
            type: 'object',
            description: 'Raw response returned by upstream login service.',
          },
        },
      },
      ApiDefinitionRecord: {
        type: 'object',
        properties: {
          serialNo: {
            type: 'integer',
          },
          projectName: {
            type: 'string',
          },
          moduleName: {
            type: 'string',
          },
          functionName: {
            type: 'string',
          },
          procedureName: {
            type: 'string',
          },
          isDebugEnabled: {
            type: 'string',
            enum: ['Y', 'N'],
          },
          isActive: {
            type: 'string',
            enum: ['Y', 'N'],
          },
          apiDescription: {
            type: 'string',
          },
          appServerFilePath: {
            type: 'string',
          },
          owner: {
            type: 'string',
          },
          updateBy: {
            type: 'string',
          },
          updateTimestamp: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      ApiDefinitionRequest: {
        type: 'object',
        required: [
          'ProjectName',
          'ModuleName',
          'FunctionName',
          'ProcedureName',
          'IsDebugEnabled',
          'IsActive',
          'APIDescription',
          'AppServerFilePath',
          'Owner',
          'UpdateBy',
        ],
        properties: {
          ProjectName: {
            type: 'string',
            example: 'Compliance',
          },
          ModuleName: {
            type: 'string',
            example: 'Reports',
          },
          FunctionName: {
            type: 'string',
            example: 'GetMonthlySummary',
          },
          ProcedureName: {
            type: 'string',
            example: 'schema.GenerateMonthlySummary',
          },
          IsDebugEnabled: {
            type: 'string',
            enum: ['Y', 'N'],
            example: 'N',
          },
          IsActive: {
            type: 'string',
            enum: ['Y', 'N'],
            example: 'Y',
          },
          APIDescription: {
            type: 'string',
            example: 'Generates month-wise compliance summary data.',
          },
          AppServerFilePath: {
            type: 'string',
            example: '/api/execute',
          },
          Owner: {
            type: 'string',
            example: 'ComplianceOps',
          },
          UpdateBy: {
            type: 'string',
            example: 'admin',
          },
        },
      },
      ExecuteRequest: {
        type: 'object',
        required: ['api'],
        properties: {
          api: {
            $ref: '#/components/schemas/ApiMetadata',
          },
          data: {
            type: 'object',
            additionalProperties: true,
            description: 'Parameters forwarded to the stored procedure.',
            example: {
              CustomerId: 1001,
              Month: '2025-10',
            },
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
          },
          details: {
            description: 'Additional error details, if available.',
          },
        },
      },
    },
  },
  security: [
    {
      BearerAuth: [],
    },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Returns service status and current timestamp.',
        security: [],
        responses: {
          200: {
            description: 'Service is healthy.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      example: 'ok',
                    },
                    timestamp: {
                      type: 'string',
                      format: 'date-time',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Authenticate user against upstream system.',
        description: 'Delegates credentials to upstream login endpoint, then returns a locally issued JWT.',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/LoginRequest',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Authentication successful.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LoginResponse',
                },
              },
            },
          },
          400: {
            description: 'Request payload invalid.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          502: {
            description: 'Upstream service error.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/definitions': {
      get: {
        tags: ['API Definitions'],
        summary: 'List API definitions.',
        parameters: [
          {
            in: 'query',
            name: 'projectName',
            schema: {
              type: 'string',
            },
          },
          {
            in: 'query',
            name: 'moduleName',
            schema: {
              type: 'string',
            },
          },
          {
            in: 'query',
            name: 'functionName',
            schema: {
              type: 'string',
            },
          },
          {
            in: 'query',
            name: 'onlyActive',
            schema: {
              type: 'boolean',
            },
            description: 'Filter to active definitions only.',
          },
        ],
        responses: {
          200: {
            description: 'Definitions fetched successfully.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                      example: true,
                    },
                    data: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/ApiDefinitionRecord',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['API Definitions'],
        summary: 'Create a new API definition.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiDefinitionRequest',
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Definition created.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                      example: true,
                    },
                    data: {
                      $ref: '#/components/schemas/ApiDefinitionRecord',
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Invalid payload.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          409: {
            description: 'Duplicate definition.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/execute': {
      get: {
        tags: ['Execution'],
        summary: 'Execute an active API definition (query params).',
        parameters: [
          {
            in: 'query',
            name: 'projectName',
            schema: {
              type: 'string',
            },
            required: true,
          },
          {
            in: 'query',
            name: 'moduleName',
            schema: {
              type: 'string',
            },
            required: true,
          },
          {
            in: 'query',
            name: 'functionName',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          200: {
            description: 'Procedure executed.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                      example: true,
                    },
                    metadata: {
                      type: 'object',
                    },
                    data: {
                      description: 'Result sets returned by the procedure.',
                    },
                  },
                },
              },
            },
          },
          404: {
            description: 'Definition not found.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Execution'],
        summary: 'Execute an active API definition (request body).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ExecuteRequest',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Procedure executed.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                      example: true,
                    },
                    metadata: {
                      type: 'object',
                    },
                    data: {
                      description: 'Result sets returned by the procedure.',
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Invalid payload.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          404: {
            description: 'Definition not found.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
  },
};
