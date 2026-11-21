import pg from 'pg';
import crypto from 'crypto';

const client = new pg.Client(process.env.DATABASE_URL || "postgres://postgres:postgres@127.0.0.1:5432/petora");

async function run() {
  await client.connect();

  const COMPANY_ID = '10000000-0000-4000-8000-0000000000c0';
  const BRANCH = {
    B1: '20000000-0000-4000-8000-0000000000b1',
    B2: '20000000-0000-4000-8000-0000000000b2',
    B3: '20000000-0000-4000-8000-0000000000b3',
  };
  const USER = {
    OWNER: '30000000-0000-4000-8000-000000000001',
    STAFF_A: '30000000-0000-4000-8000-00000000000a',
    VET_A: '30000000-0000-4000-8000-00000000000b',
    STAFF_B: '30000000-0000-4000-8000-00000000000c',
    VET_B: '30000000-0000-4000-8000-00000000000d',
    VET_NO_READ: '30000000-0000-4000-8000-00000000000e',
    SUPERVISOR_A: '30000000-0000-4000-8000-00000000000f',
  };
  const CUSTOMER_ID = '40000000-0000-4000-8000-000000000001';
  const PET_ID = '40000000-0000-4000-8000-000000000002';

  async function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = await new Promise((resolve, reject) => {
      crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey);
      });
    });
    return `scrypt$${salt}$${hash.toString('hex')}`;
  }

  await client.query('insert into company (id, name) values ($1, $2) on conflict do nothing', [COMPANY_ID, 'PT Satwa Sehat']);
  await client.query(
    `insert into branch (id, company_id, name, timezone) values
      ($1, $2, 'Cabang Jakarta', 'Asia/Jakarta'),
      ($3, $2, 'Cabang Makassar', 'Asia/Makassar'),
      ($4, $2, 'Cabang Jayapura', 'Asia/Jayapura')
    on conflict do nothing`,
    [BRANCH.B1, COMPANY_ID, BRANCH.B2, BRANCH.B3]
  );

  async function makeUser(id, name, opts) {
    const email = opts.email ?? id + '@petora.test';
    const passwordHash = opts.password ? await hashPassword(opts.password) : null;
    await client.query(
      'insert into profiles (id, full_name, is_owner, email, password_hash) values ($1, $2, $3, $4, $5) on conflict (id) do update set full_name=excluded.full_name, is_owner=excluded.is_owner, email=excluded.email, password_hash=excluded.password_hash',
      [id, name, opts.owner ?? false, email, passwordHash]
    );
    const roleRes = await client.query('select id from role where code = $1', [opts.roleCode]);
    const roleId = roleRes.rows[0].id;
    await client.query('insert into user_role (user_id, role_id) values ($1, $2) on conflict do nothing', [id, roleId]);
    for (const b of opts.branches) {
      await client.query('insert into branch_members (user_id, branch_id) values ($1, $2) on conflict do nothing', [id, b]);
    }
  }

  const PASSWORD = 'rahasia123';

  await makeUser(USER.OWNER, 'Owner', { owner: true, roleCode: 'owner', branches: [BRANCH.B1, BRANCH.B2, BRANCH.B3], email: 'owner@petora.test', password: PASSWORD });
  await makeUser(USER.STAFF_A, 'Staff A', { roleCode: 'staff', branches: [BRANCH.B1], email: 'staff.a@petora.test', password: PASSWORD });
  await makeUser(USER.VET_A, 'Dokter A', { roleCode: 'vet', branches: [BRANCH.B1] });
  await makeUser(USER.STAFF_B, 'Staff B', { roleCode: 'staff', branches: [BRANCH.B2], email: 'staff.b@petora.test', password: PASSWORD });
  await makeUser(USER.VET_B, 'Dokter B', { roleCode: 'vet', branches: [BRANCH.B2] });
  await makeUser(USER.VET_NO_READ, 'Dokter X', { roleCode: 'vet', branches: [BRANCH.B1] });
  await makeUser(USER.SUPERVISOR_A, 'Supervisor A', { roleCode: 'supervisor', branches: [BRANCH.B1] });

  await client.query(
    `insert into user_permission (user_id, permission_id, granted)
    values ($1, (select id from permission where code='medical.read'), false)
    on conflict (user_id, permission_id) do update set granted = excluded.granted`,
    [USER.VET_NO_READ]
  );

  await client.query('insert into customer (id, full_name, phone) values ($1, $2, $3) on conflict do nothing', [CUSTOMER_ID, 'Budi Santoso', '08123456789']);
  await client.query('insert into pet (id, customer_id, name, species, sex) values ($1, $2, $3, $4, $5) on conflict do nothing', [PET_ID, CUSTOMER_ID, 'Milo', 'canine', 'male']);

  await client.query(
    `insert into product (id, sku, name, kind, price, taxable) values
      ('50000000-0000-4000-8000-000000000001','JAS-KONS','Konsultasi',    'service', 75000,  true),
      ('50000000-0000-4000-8000-000000000002','VAK-Rabies','Vaksin Rabies','service',150000,  true),
      ('50000000-0000-4000-8000-000000000003','OBT-001','Obat Antipiretik','product',22350,  true)
    on conflict do nothing`
  );

  console.log('Seed done');
  await client.end();
}

run().catch(e => { console.error(e); process.exit(1); });