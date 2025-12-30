export const entityManagerMock = () => ({
  getRepository: jest.fn(),
})

export type EntityManagerMock = ReturnType<typeof entityManagerMock>
