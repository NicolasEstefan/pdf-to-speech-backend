export const dataSourceMock = (entityManager) => ({
  transaction: jest
    .fn()
    .mockImplementation(async (callback: (manager) => Promise<any>) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return await callback(entityManager)
    }),
})

export type DataSourceMock = ReturnType<typeof dataSourceMock>
