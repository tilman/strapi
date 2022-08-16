import togglePermissions from '../togglePermissions';

const state = {
  modifiedData: {
    collectionTypes: {
      'api::category': {
        create: true,
        findOne: true,
        find: false,
        update: false,
        delete: false,
      },
    },
  },
};

describe('ADMIN | Container | SettingsPage | ApiTokens | EditView | utils | togglePermissions', () => {
  it('should return updated values all toggled true for a specific content type', () => {
    const action = {
      keys: ['collectionTypes', 'api::category'],
      value: true,
    };

    const { pathToValue, updatedValues } = togglePermissions(action, state);

    expect(pathToValue).toEqual(['modifiedData', 'collectionTypes', 'api::category']);
    expect(updatedValues).toEqual({
      create: true,
      findOne: true,
      find: true,
      update: true,
      delete: true,
    });
  });

  it('should return updated values with only find and find-one as true values for a specific content type', () => {
    const action = {
      keys: ['collectionTypes', 'api::category'],
      value: false,
    };

    const { pathToValue, updatedValues } = togglePermissions(action, state, ['find', 'findOne']);

    expect(pathToValue).toEqual(['modifiedData', 'collectionTypes', 'api::category']);
    expect(updatedValues).toEqual({
      create: false,
      findOne: true,
      find: true,
      update: false,
      delete: false,
    });
  });
});