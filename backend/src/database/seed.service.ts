import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../modules/users/user.entity';
import { Product } from '../modules/products/product.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) { }

  async onModuleInit(): Promise<void> {
    const count = await this.userRepo.count();
    if (count > 0) {
      this.logger.log('Database already seeded, skipping.');
      return;
    }

    this.logger.log('Seeding database...');

    await this.userRepo.save(
      this.userRepo.create({
        name: 'Demo User',
        email: 'demo@casecellshop.com',
        street: 'Av. Paulista',
        number: '1374',
        complement: 'Apto 52',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01310-100',
        country: 'Brasil',
      }),
    );

    await this.productRepo.save([
      // Capinhas
      this.productRepo.create({
        name: 'Capinha MagSafe iPhone 15 Pro',
        description: 'Silicone premium com suporte MagSafe, bordas elevadas e acabamento aveludado',
        price: 89.9,
        stock_quantity: 40,
        sku: 'CAP-IP15P-001',
        image_url: 'https://picsum.photos/seed/iphone15pro/400/300',
      }),
      this.productRepo.create({
        name: 'Capinha Anti-impacto Samsung Galaxy S24',
        description: 'Proteção militar MIL-STD-810G, TPU reforçado com bordas air-cushion',
        price: 69.9,
        stock_quantity: 35,
        sku: 'CAP-S24-001',
        image_url: 'https://picsum.photos/seed/galaxys24/400/300',
      }),
      this.productRepo.create({
        name: 'Capinha Clear iPhone 14 — Transparente',
        description: 'Policarbonato cristal anti-amarelamento, proteção lateral em TPU',
        price: 49.9,
        stock_quantity: 60,
        sku: 'CAP-IP14-002',
        image_url: 'https://picsum.photos/seed/clearcase/400/300',
      }),
      this.productRepo.create({
        name: 'Capinha Couro iPhone 15 Plus — Marrom',
        description: 'Couro legítimo curtido, interior aveludado, bordas costuradas à mão',
        price: 129.9,
        stock_quantity: 15,
        sku: 'CAP-IP15PL-003',
        image_url: 'https://picsum.photos/seed/leathercase/400/300',
      }),
      this.productRepo.create({
        name: 'Capinha Silicone Samsung Galaxy A55 — Lilás',
        description: 'Silicone líquido soft-touch, microfibra interna, disponível em 8 cores',
        price: 44.9,
        stock_quantity: 45,
        sku: 'CAP-A55-004',
        image_url: 'https://picsum.photos/seed/siliconecase/400/300',
      }),
      this.productRepo.create({
        name: 'Capinha Wallet iPhone 15 — Porta-cartão',
        description: '2 slots para cartão, suporte de apoio integrado, couro sintético premium',
        price: 79.9,
        stock_quantity: 25,
        sku: 'CAP-IP15-005',
        image_url: 'https://picsum.photos/seed/walletcase/400/300',
      }),
      // Películas
      this.productRepo.create({
        name: 'Película Vidro Temperado iPhone 15 — Kit 2un',
        description: '9H de dureza, cobertura total, kit com guia de instalação e 2 películas',
        price: 34.9,
        stock_quantity: 80,
        sku: 'PEL-IP15-001',
        image_url: 'https://picsum.photos/seed/glassfilm/400/300',
      }),
      this.productRepo.create({
        name: 'Película Privacidade Samsung S24 Ultra',
        description: 'Vidro temperado 9H com filtro de privacidade 45°, oleofóbico',
        price: 54.9,
        stock_quantity: 30,
        sku: 'PEL-S24U-002',
        image_url: 'https://picsum.photos/seed/privacyfilm/400/300',
      }),
      this.productRepo.create({
        name: 'Película Fosca iPhone 14 Pro — Anti-reflexo',
        description: 'Matte 9H, reduz reflexos e marcas de dedos, toque suave',
        price: 39.9,
        stock_quantity: 50,
        sku: 'PEL-IP14P-003',
        image_url: 'https://picsum.photos/seed/mattefilm/400/300',
      }),
      this.productRepo.create({
        name: 'Película Cerâmica Xiaomi 14T — Flexível',
        description: 'Cerâmica flexível HD, cobertura borda a borda, auto-regenerativa',
        price: 29.9,
        stock_quantity: 0,
        sku: 'PEL-XI14T-004',
        image_url: 'https://picsum.photos/seed/ceramicfilm/400/300',
      }),
      // Carregadores e cabos
      this.productRepo.create({
        name: 'Carregador Wireless 15W Qi2',
        description: 'Compatível com MagSafe e Qi2, carregamento rápido 15W, base antiderrapante',
        price: 149.9,
        stock_quantity: 20,
        sku: 'CAR-WL-001',
        image_url: 'https://picsum.photos/seed/wirelesscharger/400/300',
      }),
      this.productRepo.create({
        name: 'Carregador Turbo 65W USB-C — GaN',
        description: 'Tecnologia GaN, PD 3.0, carrega notebook e celular simultaneamente',
        price: 119.9,
        stock_quantity: 18,
        sku: 'CAR-65W-002',
        image_url: 'https://picsum.photos/seed/gancharger/400/300',
      }),
      this.productRepo.create({
        name: 'Carregador Veicular Duplo 30W',
        description: 'USB-A + USB-C, Quick Charge 4.0, indicador LED, compacto',
        price: 64.9,
        stock_quantity: 35,
        sku: 'CAR-VEI-003',
        image_url: 'https://picsum.photos/seed/carcharger/400/300',
      }),
      this.productRepo.create({
        name: 'Cabo Lightning MFi 1.5m — Certificado Apple',
        description: 'Certificação Apple MFi, nylon trançado reforçado, carga 20W',
        price: 59.9,
        stock_quantity: 40,
        sku: 'CAB-LTG-001',
        image_url: 'https://picsum.photos/seed/lightningcable/400/300',
      }),
      this.productRepo.create({
        name: 'Cabo USB-C para USB-C 2m — Nylon',
        description: 'Nylon trançado, carga rápida 65W, transferência 480Mbps',
        price: 44.9,
        stock_quantity: 55,
        sku: 'CAB-USBC-002',
        image_url: 'https://picsum.photos/seed/usbccable/400/300',
      }),
      // Acessórios
      this.productRepo.create({
        name: 'Suporte Veicular Magnético',
        description: 'Fixação no painel ou saída de ar, rotação 360°, compatível com todos os celulares',
        price: 59.9,
        stock_quantity: 50,
        sku: 'SUP-VEI-001',
        image_url: 'https://picsum.photos/seed/carmount/400/300',
      }),
      this.productRepo.create({
        name: 'Pop Socket Magnético MagSafe',
        description: 'Compatível com MagSafe, base extensível, superfície personalizável',
        price: 49.9,
        stock_quantity: 60,
        sku: 'POP-MAG-001',
        image_url: 'https://picsum.photos/seed/popsocket/400/300',
      }),
      this.productRepo.create({
        name: 'Anel Suporte 360° Metálico — Prata',
        description: 'Alumínio aeroespacial, rotação 360° + inclinação 180°, adesivo 3M',
        price: 34.9,
        stock_quantity: 70,
        sku: 'ANE-360-001',
        image_url: 'https://picsum.photos/seed/ringstand/400/300',
      }),
      this.productRepo.create({
        name: 'Fone Bluetooth In-Ear — Cancelamento de Ruído',
        description: 'ANC ativo, drivers 10mm, autonomia 28h com estojo, IPX5',
        price: 249.9,
        stock_quantity: 12,
        sku: 'FON-BT-001',
        image_url: 'https://picsum.photos/seed/earbuds/400/300',
      }),
      this.productRepo.create({
        name: 'Capa com Bateria iPhone 15 — 4000mAh',
        description: 'Bateria integrada 4000mAh, carregamento via USB-C, proteção anti-impacto',
        price: 199.9,
        stock_quantity: 8,
        sku: 'BAT-IP15-001',
        image_url: 'https://picsum.photos/seed/batterycase/400/300',
      }),
    ]);

    this.logger.log('Seed complete — 1 user, 20 products.');
  }
}
