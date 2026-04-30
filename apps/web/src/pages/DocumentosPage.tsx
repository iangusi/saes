import { useState } from 'react';

interface DocumentCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  filename: string;
  color: string;
  gradient: string;
}

const documents: DocumentCard[] = [
  {
    id: 'boleta-global',
    title: 'Boleta Global',
    description: 'Historial completo de calificaciones por semestre',
    icon: '📋',
    filename: 'boleta_global.pdf',
    color: '#7C1033',
    gradient: 'linear-gradient(135deg, #7C1033 0%, #a8144a 100%)',
  },
  {
    id: 'constancia-inscripcion',
    title: 'Constancia de Inscripción',
    description: 'Documento oficial que acredita tu inscripción al periodo actual',
    icon: '📝',
    filename: 'constancia_inscripcion.pdf',
    color: '#1a4b8c',
    gradient: 'linear-gradient(135deg, #1a4b8c 0%, #2563b0 100%)',
  },
  {
    id: 'constancia-estudios',
    title: 'Constancia de Estudios',
    description: 'Comprobante oficial de que eres alumno activo de la institución',
    icon: '🎓',
    filename: 'constancia_estudios.pdf',
    color: '#065f46',
    gradient: 'linear-gradient(135deg, #065f46 0%, #059669 100%)',
  },
  {
    id: 'constancia-becas',
    title: 'Constancia para Becas',
    description: 'Documento requerido para trámites y solicitudes de beca',
    icon: '🏆',
    filename: 'constancia_becas.pdf',
    color: '#78350f',
    gradient: 'linear-gradient(135deg, #78350f 0%, #d97706 100%)',
  },
  {
    id: 'horario',
    title: 'Horario',
    description: 'Horario de clases del periodo académico vigente',
    icon: '📅',
    filename: 'horario.pdf',
    color: '#4c1d95',
    gradient: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)',
  },
];

export function DocumentosPage() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<Set<string>>(new Set());

  const handleDownload = async (doc: DocumentCard) => {
    if (downloading) return;
    setDownloading(doc.id);

    // Simulate a brief loading delay for UX feedback
    await new Promise((resolve) => setTimeout(resolve, 900));

    // Generate a minimal placeholder PDF blob
    const pdfContent = `%PDF-1.4
1 0 obj<</Type /Catalog /Pages 2 0 R>>endobj
2 0 obj<</Type /Pages /Kids [3 0 R] /Count 1>>endobj
3 0 obj<</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]
/Contents 4 0 R /Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 44>>
stream
BT /F1 18 Tf 72 720 Td (${doc.title}) Tj ET
endstream
endobj
5 0 obj<</Type /Font /Subtype /Type1 /BaseFont /Helvetica>>endobj
xref
0 6
0000000000 65535 f 
trailer<</Size 6 /Root 1 0 R>>
startxref
0
%%EOF`;

    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = doc.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloaded((prev) => new Set(prev).add(doc.id));
    setDownloading(null);
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header section */}
      <div style={{ marginBottom: '2rem' }}>
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: '#1e1b4b',
            margin: 0,
            letterSpacing: '-0.5px',
          }}
        >
          Documentos
        </h1>
        <p style={{ color: '#6b7280', marginTop: '0.4rem', fontSize: '0.95rem' }}>
          Descarga tus documentos oficiales en formato PDF con un solo clic.
        </p>
      </div>

      {/* Cards grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {documents.map((doc) => {
          const isLoading = downloading === doc.id;
          const isDone = downloaded.has(doc.id);

          return (
            <button
              key={doc.id}
              id={`doc-card-${doc.id}`}
              onClick={() => handleDownload(doc)}
              disabled={!!downloading}
              style={{
                background: '#ffffff',
                border: '1.5px solid #e5e7eb',
                borderRadius: '16px',
                padding: '0',
                cursor: downloading ? (isLoading ? 'wait' : 'not-allowed') : 'pointer',
                textAlign: 'left',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                overflow: 'hidden',
                opacity: downloading && !isLoading ? 0.6 : 1,
                transform: 'translateY(0)',
                outline: 'none',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!downloading) {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-4px)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    '0 12px 28px rgba(0,0,0,0.13)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = doc.color;
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb';
              }}
            >
              {/* Color banner */}
              <div
                style={{
                  background: doc.gradient,
                  height: '6px',
                  width: '100%',
                }}
              />

              <div style={{ padding: '1.5rem' }}>
                {/* Icon */}
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    background: `${doc.color}18`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.6rem',
                    marginBottom: '1rem',
                  }}
                >
                  {doc.icon}
                </div>

                {/* Title */}
                <h2
                  style={{
                    margin: '0 0 0.4rem 0',
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: '#111827',
                    lineHeight: 1.3,
                  }}
                >
                  {doc.title}
                </h2>

                {/* Description */}
                <p
                  style={{
                    margin: '0 0 1.25rem 0',
                    fontSize: '0.82rem',
                    color: '#6b7280',
                    lineHeight: 1.5,
                  }}
                >
                  {doc.description}
                </p>

                {/* Download button */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: isLoading
                      ? '#f3f4f6'
                      : isDone
                      ? '#d1fae5'
                      : doc.gradient,
                    color: isLoading ? '#6b7280' : isDone ? '#065f46' : '#fff',
                    borderRadius: '10px',
                    padding: '0.6rem 1rem',
                    fontSize: '0.83rem',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                    justifyContent: 'center',
                  }}
                >
                  {isLoading ? (
                    <>
                      <Spinner />
                      Generando PDF…
                    </>
                  ) : isDone ? (
                    <>✅ Descargado</>
                  ) : (
                    <>⬇️ Descargar PDF</>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p
        style={{
          marginTop: '2rem',
          fontSize: '0.78rem',
          color: '#9ca3af',
          textAlign: 'center',
        }}
      >
        Los documentos son generados con la información actualizada de tu expediente académico.
      </p>
    </div>
  );
}

function Spinner() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: '14px',
        height: '14px',
        border: '2px solid #d1d5db',
        borderTopColor: '#6b7280',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }}
    />
  );
}
