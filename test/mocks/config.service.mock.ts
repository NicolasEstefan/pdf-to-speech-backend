export const configServiceMock = () => ({
  getOrThrow: jest.fn(),
})

export type ConfigServiceMock = ReturnType<typeof configServiceMock>
