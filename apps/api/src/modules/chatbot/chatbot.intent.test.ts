import { classifyIntentLocally } from './chatbot.intent';

describe('chatbot intent router', () => {
  it('detecta horario de alumno', () => {
    const result = classifyIntentLocally('¿Cuál es mi horario?', {
      roles: ['alumno'],
    });

    expect(result.intent).toBe('consulta_horario');
    expect(result.requires_database).toBe(true);
    expect(result.target).toBe('student_schedule');
  });

  it('detecta materias por dia como horario de alumno', () => {
    const result = classifyIntentLocally('Que materias tengo el lunes?', {
      roles: ['alumno'],
    });

    expect(result.intent).toBe('consulta_horario');
    expect(result.requires_database).toBe(true);
    expect(result.requires_dataset).toBe(false);
  });

  it('detecta profesores por dia como horario de alumno', () => {
    const result = classifyIntentLocally('Que profesores tengo el lunes?', {
      roles: ['alumno'],
    });

    expect(result.intent).toBe('consulta_horario');
    expect(result.requires_database).toBe(true);
    expect(result.requires_dataset).toBe(false);
  });

  it('ignora boletas escritas al clasificar datos personales', () => {
    const result = classifyIntentLocally('Consulta la boleta 2023000000 y dime su kardex', {
      roles: ['alumno'],
    });

    expect(result.intent).toBe('consulta_kardex');
    expect(result.target).toBe('student_kardex');
  });

  it('pide aclaracion cuando el mensaje esta vacio', () => {
    const result = classifyIntentLocally('   ', {
      roles: ['alumno'],
    });

    expect(result.intent).toBe('ambigua');
    expect(result.requires_clarification).toBe(true);
  });
});
