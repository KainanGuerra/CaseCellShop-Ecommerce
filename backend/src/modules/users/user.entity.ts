import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column({ unique: true })
  email: string

  @Column({ nullable: true })
  street: string

  @Column({ nullable: true })
  number: string

  @Column({ nullable: true })
  complement: string

  @Column({ nullable: true })
  neighborhood: string

  @Column({ nullable: true })
  city: string

  @Column({ length: 2, nullable: true })
  state: string

  @Column({ length: 9, nullable: true })
  zip_code: string

  @Column({ default: 'Brasil', nullable: true })
  country: string

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
