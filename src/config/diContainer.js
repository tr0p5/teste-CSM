import { createContainer, asClass, asFunction, asValue } from 'awilix';
import UserRepository from '../repositories/userRepository.js';
import UserService from '../services/userService.js';
import UserController from '../controllers/userController.js';
import initializeDb from './database.js';
import config from './env.js';
import logger from '../log/logger.js';

const createDIContainer = async () => {
	logger.info(`[DIContainer] Inicializando`);

	const container = createContainer();
  	const db = await initializeDb(config.dbPath);

	container.register({
		config: asValue(config),
    	db: asFunction(() => db).singleton(),
		userRepository: asClass(UserRepository).singleton(),
		userService: asClass(UserService).singleton(),
		userController: asClass(UserController).singleton(),
	});

	return container;
};

export default createDIContainer;
