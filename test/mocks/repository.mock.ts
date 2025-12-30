export const repositoryMock = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
})

export type RepositoryMock = ReturnType<typeof repositoryMock>
