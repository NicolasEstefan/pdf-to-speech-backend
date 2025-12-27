export const repositoryMock = () => ({
  create: jest.fn(),
  save: jest.fn(),
})

export type RepositoryMock = ReturnType<typeof repositoryMock>
