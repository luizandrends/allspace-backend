import FakeUsersRepository from '@modules/users/interfaces/fakes/FakeUsersRepository';
import FakeHashProvider from '@modules/users/providers/HashProvider/fakes/FakeHashProvider';
import CreateUserService from '@modules/users/services/CreateUserService';
import AppError from '@shared/errors/AppError';
import FakeAdvertsRepository from '../interfaces/fakes/FakeAdvertsRepository';

import CreateAdvertService from './CreateAdvertService';
import RemoveStockQuantityService from './RemoveStockQuantityService';

let fakeUsersRepository: FakeUsersRepository;
let fakeAdvertsRepository: FakeAdvertsRepository;
let fakeHashProvider: FakeHashProvider;
let createAdvertService: CreateAdvertService;
let createUserService: CreateUserService;
let removeStockQuantityService: RemoveStockQuantityService;

describe('RemoveStockQuantity', () => {
  beforeEach(() => {
    fakeUsersRepository = new FakeUsersRepository();
    fakeAdvertsRepository = new FakeAdvertsRepository();
    fakeHashProvider = new FakeHashProvider();

    createUserService = new CreateUserService(
      fakeUsersRepository,
      fakeHashProvider
    );

    createAdvertService = new CreateAdvertService(
      fakeUsersRepository,
      fakeAdvertsRepository
    );

    removeStockQuantityService = new RemoveStockQuantityService(
      fakeAdvertsRepository
    );
  });

  it('should be able to remove the advert stock number', async () => {
    const userData = {
      name: 'John Doe',
      email: 'johndoe@example.com',
      cpf: '100.100.100-10',
      password: '123456',
    };

    const user = await createUserService.execute(userData);

    const { id } = user;

    const advertData = {
      user_id: id,
      name: 'Playstation 5',
      price: 4500,
      description: 'Sony videogame',
      brand: 'Sony',
      model: 'Playstation 5',
      color: 'White',
      in_stock: 40,
    };

    const advert = await createAdvertService.execute(advertData);

    const increaseStock = await removeStockQuantityService.execute({
      advert_id: advert.id,
      quantity: 2,
    });

    const expectedAdvert = {
      id: increaseStock.id,
      user_id: increaseStock.user_id,
      name: 'Playstation 5',
      price: 4500,
      description: 'Sony videogame',
      brand: 'Sony',
      model: 'Playstation 5',
      color: 'White',
      in_stock: 38,
    };

    expect(increaseStock).toEqual(expectedAdvert);
  });

  it('should not be able to remove the stocknumber of a unexistent advert', async () => {
    await expect(
      removeStockQuantityService.execute({
        advert_id: 'd85cb127-3d02-4b6d-9e5b-cd349259e438',
        quantity: 2,
      })
    ).rejects.toBeInstanceOf(AppError);
  });
});
