export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'CSM API',
    version: '0.0.1',
    description: 'API para o Concurrent Streaming Manager',
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Servidor de desenvolvimento',
    },
  ],
  components: {
    schemas: {
      Usuario: {
        type: 'object',
        required: ['idUsuario', 'limite'],
        properties: {
          idUsuario: {
            type: 'string',
            description: 'ID único do usuário',
          },
          limite: {
            type: 'integer',
            description: 'Limite de streams simultâneos',
          },
          streamsAgora: {
            type: 'integer',
            description: 'Número de streams simultâneos ligados',
          },
        },
        example: {
          idUsuario: 'user1',
          limite: 3,
        },
      },
      NovoLimite: {
        type: 'object',
        required: ['novoLimite'],
        properties: {
          novoLimite: {
            type: 'integer',
            description: 'Novo limite de streams simultâneos para usuário',
          },
        },
        example: {
          novoLimite: 5,
        },
      },
    },
    responses: {
      UsuarioNaoExiste: {
        description: 'O usuário não existe',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: {
                  type: 'string',
                  example: 'Usuario nao existe',
                },
              },
            },
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Usuarios',
      description: 'Gerenciamento de usuários e seus limites de streams',
    },
  ],
  paths: {
    '/usuarios': {
      post: {
        summary: 'Registra um novo usuário',
        tags: ['Usuarios'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Usuario',
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Usuário registrado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Usuario registrado com sucesso',
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Erro na requisição',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: {
                      type: 'string',
                      example: 'O limite deve ser maior que 1',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/usuarios/{idUsuario}': {
      delete: {
        summary: 'Deleta um usuário',
        tags: ['Usuarios'],
        parameters: [
          {
            in: 'path',
            name: 'idUsuario',
            schema: {
              type: 'string',
            },
            required: true,
            description: 'ID do usuário',
          },
        ],
        responses: {
          200: {
            description: 'Usuário deletado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Usuario deletado com sucesso',
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Erro na requisição',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/responses/UsuarioNaoExiste',
                },
              },
            },
          },
        },
      },
    },
    '/usuarios/{idUsuario}/limite': {
      get: {
        summary: 'Verifica o limite de streams de um usuário',
        tags: ['Usuarios'],
        parameters: [
          {
            in: 'path',
            name: 'idUsuario',
            schema: {
              type: 'string',
            },
            required: true,
            description: 'ID do usuário',
          },
        ],
        responses: {
          200: {
            description: 'Limite verificado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    canStart: {
                      type: 'boolean',
                      example: true,
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Erro na requisição',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/responses/UsuarioNaoExiste',
                },
              },
            },
          },
        },
      },
      put: {
        summary: 'Atualiza o limite de streams de um usuário',
        tags: ['Usuarios'],
        parameters: [
          {
            in: 'path',
            name: 'idUsuario',
            schema: {
              type: 'string',
            },
            required: true,
            description: 'ID do usuário',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/NovoLimite',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Limite atualizado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Limite atualizado com sucesso',
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Erro na requisição',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: {
                      type: 'string',
                      example: 'Novo limite não pode ser menor que o número atual de streams ativas',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/usuarios/{idUsuario}/streams': {
      post: {
        summary: 'Inicia uma stream para um usuário',
        tags: ['Usuarios'],
        parameters: [
          {
            in: 'path',
            name: 'idUsuario',
            schema: {
              type: 'string',
            },
            required: true,
            description: 'ID do usuário',
          },
        ],
        responses: {
          200: {
            description: 'Stream iniciada com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Stream iniciada com sucesso',
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Erro na requisição',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: {
                      type: 'string',
                      example: 'Usuario alconçou o limite',
                    },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        summary: 'Para uma stream de um usuário',
        tags: ['Usuarios'],
        parameters: [
          {
            in: 'path',
            name: 'idUsuario',
            schema: {
              type: 'string',
            },
            required: true,
            description: 'ID do usuário',
          },
        ],
        responses: {
          200: {
            description: 'Stream parada com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Stream parada com sucesso',
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Erro na requisição',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: {
                      type: 'string',
                      example: 'Usuario não existe',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
