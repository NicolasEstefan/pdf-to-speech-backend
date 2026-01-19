export const repositoryMock = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
})

export type RepositoryMock = ReturnType<typeof repositoryMock>
