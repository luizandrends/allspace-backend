import AppError from '@shared/errors/AppError';

import FakeUsersRepository from '../interfaces/fakes/FakeUsersRepository';
import FakeUserTokensRepository from '../interfaces/fakes/FakeUserTokensRepository';
import FakeBlacklistTokensRepository from '../interfaces/fakes/FakeBlacklistTokensRepository';
import FakeHashProvider from '../providers/HashProvider/fakes/FakeHashProvider';
import ResetPasswordService from './ResetPasswordService';

let fakeUsersRepository: FakeUsersRepository;
let fakeUserTokensRepository: FakeUserTokensRepository;
let fakeBlacklistTokensRepository: FakeBlacklistTokensRepository;
let fakeHashProvider: FakeHashProvider;
let resetPassword: ResetPasswordService;

describe('ResetPasswordService', () => {
  beforeEach(() => {
    fakeUsersRepository = new FakeUsersRepository();
    fakeUserTokensRepository = new FakeUserTokensRepository();
    fakeHashProvider = new FakeHashProvider();
    fakeBlacklistTokensRepository = new FakeBlacklistTokensRepository();

    resetPassword = new ResetPasswordService(
      fakeUsersRepository,
      fakeUserTokensRepository,
      fakeHashProvider,
      fakeBlacklistTokensRepository
    );
  });

  it('should be able to reset the password', async () => {
    const user = await fakeUsersRepository.create({
      name: 'John Doe',
      email: 'johndoe@example.com',
      cpf: '100.100.100-03',
      password: '123456',
    });

    const { token } = await fakeUserTokensRepository.generate(user.id);

    const generateHash = jest.spyOn(fakeHashProvider, 'generateHash');
    const createToken = jest.spyOn(fakeBlacklistTokensRepository, 'create');

    await resetPassword.execute({
      password: '123123',
      token,
    });

    const createTokenPayload = {
      token,
    };

    const updatedUser = await fakeUsersRepository.findById(user.id);

    expect(generateHash).toHaveBeenCalledWith('123123');
    expect(createToken).toHaveBeenCalledWith(createTokenPayload);
    expect(updatedUser?.password).toBe('123123');
  });

  it('should not be able to reset the password with non-existing token', async () => {
    await expect(
      resetPassword.execute({
        token: 'non-existing-token',
        password: '123456',
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it('should not be able to reset the password with non-existing user', async () => {
    const { token } = await fakeUserTokensRepository.generate(
      'non-existing-user'
    );

    await expect(
      resetPassword.execute({
        token,
        password: '123456',
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it('should not be able to reset password if passed more than 2 hours', async () => {
    const user = await fakeUsersRepository.create({
      name: 'John Doe',
      email: 'johndoe@example.com',
      cpf: '100.100.100-03',
      password: '123456',
    });

    const { token } = await fakeUserTokensRepository.generate(user.id);

    jest.spyOn(Date, 'now').mockImplementationOnce(() => {
      const customDate = new Date();

      return customDate.setHours(customDate.getHours() + 3);
    });

    await expect(
      resetPassword.execute({
        password: '123123',
        token,
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it('should not be able to reset the password with an invalid token', async () => {
    const user = await fakeUsersRepository.create({
      name: 'John Doe',
      email: 'johndoe@example.com',
      cpf: '100.100.100-03',
      password: '123456',
    });

    const { token } = await fakeUserTokensRepository.generate(user.id);

    await resetPassword.execute({
      password: '123123',
      token,
    });

    await expect(
      resetPassword.execute({ password: '123123', token })
    ).rejects.toBeInstanceOf(AppError);
  });
});