import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ProductsModule } from './modules/products/products.module'
import { OrdersModule } from './modules/orders/orders.module'
import { UsersModule } from './modules/users/users.module'
import { SeedService } from './database/seed.service'
import { User } from './modules/users/user.entity'
import { Product } from './modules/products/product.entity'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5433),
        username: config.get<string>('DB_USER', 'casecell_user'),
        password: config.get<string>('DB_PASSWORD', 'casecell_password'),
        database: config.get<string>('DB_NAME', 'casecell_db'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        logging: ['error'],
      }),
    }),
    TypeOrmModule.forFeature([User, Product]),
    ProductsModule,
    OrdersModule,
    UsersModule,
  ],
  providers: [SeedService],
})
export class AppModule {}
