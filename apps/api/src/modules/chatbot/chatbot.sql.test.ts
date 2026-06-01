import { getSemanticTablesForRoles } from './chatbot.catalog';
import { validateAndPrepareSqlPlan } from './chatbot.sql';
import { DatabaseSqlPlan } from './chatbot.types';

const alumnoCatalog = getSemanticTablesForRoles(['alumno']);

function sqlPlan(overrides: Partial<DatabaseSqlPlan>): DatabaseSqlPlan {
  return {
    type: 'sql',
    sql: 'SELECT boleta FROM alumno WHERE id_usuario = :authUserId',
    params: {},
    tables: ['alumno'],
    columns: ['alumno.boleta', 'alumno.id_usuario'],
    purpose: 'Consultar datos propios',
    expected_result: 'Filas autorizadas',
    ...overrides,
  };
}

describe('chatbot SQL guardrails', () => {
  it('prepara SELECT con filtro del usuario autenticado', () => {
    const validated = validateAndPrepareSqlPlan(sqlPlan({}), alumnoCatalog, {
      idUsuario: 42,
      roles: ['alumno'],
    });

    expect(validated.sql).toBe('SELECT boleta FROM alumno WHERE id_usuario = ? LIMIT 100');
    expect(validated.params).toEqual([42]);
    expect(validated.tables).toContain('alumno');
  });

  it('rechaza sentencias que no sean SELECT', () => {
    expect(() =>
      validateAndPrepareSqlPlan(
        sqlPlan({ sql: 'UPDATE alumno SET estatus = "BAJA"', columns: ['alumno.estatus'] }),
        alumnoCatalog,
        { idUsuario: 42, roles: ['alumno'] }
      )
    ).toThrow('Solo se permiten consultas SELECT');
  });

  it('rechaza datos personales sin filtro autenticado', () => {
    expect(() =>
      validateAndPrepareSqlPlan(
        sqlPlan({ sql: 'SELECT boleta FROM alumno', columns: ['alumno.boleta'] }),
        alumnoCatalog,
        { idUsuario: 42, roles: ['alumno'] }
      )
    ).toThrow('deben filtrar por el usuario autenticado');
  });

  it('rechaza tablas fuera del catalogo del rol', () => {
    expect(() =>
      validateAndPrepareSqlPlan(
        sqlPlan({ sql: 'SELECT id_profesor FROM profesor', tables: ['profesor'], columns: ['profesor.id_profesor'] }),
        alumnoCatalog,
        { idUsuario: 42, roles: ['alumno'] }
      )
    ).toThrow('Tabla no permitida');
  });
});
