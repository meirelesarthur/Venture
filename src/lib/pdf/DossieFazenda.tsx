import {
  Document, Page, Text, View, StyleSheet, pdf, Image,
} from '@react-pdf/renderer'
import type { Fazenda, Talhao, DadosManejoAnual, ResultadoMotor, BaselineProjeto } from '@/store/data'
import LogoPng from '@/assets/Logo.png'

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, padding: 40, color: '#1a1a1a' },
  logo: { width: 100, marginBottom: 16 },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#0f5c3e', marginBottom: 4 },
  subtitle: { fontSize: 11, color: '#555', marginBottom: 20 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#0f5c3e', borderBottomWidth: 1, borderBottomColor: '#d4e8db', paddingBottom: 3, marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  label: { color: '#666', flex: 1 },
  value: { fontFamily: 'Helvetica-Bold', textAlign: 'right', flex: 1 },
  table: { borderWidth: 1, borderColor: '#d0d0d0', borderRadius: 3, marginTop: 4 },
  tableHead: { flexDirection: 'row', backgroundColor: '#e8f5ee', padding: 4 },
  tableRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#eee', padding: 4 },
  col1: { flex: 2 },
  col2: { flex: 1, textAlign: 'right' },
  deltaBox: { backgroundColor: '#e8f5ee', borderWidth: 1, borderColor: '#0f5c3e', borderRadius: 4, padding: 10, marginTop: 8 },
  deltaTitle: { fontFamily: 'Helvetica-Bold', color: '#0f5c3e', fontSize: 10, marginBottom: 4 },
  deltaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 1.5 },
  deltaTotalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#0f5c3e', marginTop: 4, paddingTop: 4 },
  deltaTotalLabel: { fontFamily: 'Helvetica-Bold', color: '#0f5c3e', fontSize: 10 },
  deltaTotalValue: { fontFamily: 'Helvetica-Bold', color: '#0f5c3e', fontSize: 10 },
  footer: { position: 'absolute', bottom: 24, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: '#999' },
})

interface Props {
  fazenda: Fazenda
  talhoes: Talhao[]
  manejos: DadosManejoAnual[]
  resultados: ResultadoMotor[]
  baseline: BaselineProjeto | undefined
  anoAgricola: number
}

function DossieFazenda({ fazenda, talhoes, resultados, baseline, anoAgricola }: Props) {
  const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const totalVcus = resultados.reduce((s, r) => s + r.vcusEmitidosTotal, 0)
  const totalBaseline = baseline?.totalTco2e ?? 0
  const creditos = totalVcus - totalBaseline
  const geradoEm = new Date().toLocaleString('pt-BR')

  const projetoTalhoes = talhoes.filter(t => t.tipo === 'projeto')

  return (
    <Document title={`Dossiê — ${fazenda.nome}`} author="Venture Carbon">
      <Page size="A4" style={styles.page}>
        {/* Capa */}
        <Image src={LogoPng} style={styles.logo} />
        <Text style={styles.title}>{fazenda.nome}</Text>
        <Text style={styles.subtitle}>
          {fazenda.municipio}/{fazenda.estado} · {fazenda.areaTotalHa.toLocaleString('pt-BR')} ha · Safra {anoAgricola}/{anoAgricola + 1}
        </Text>

        {/* Resumo Executivo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo Executivo</Text>
          <View style={styles.row}><Text style={styles.label}>Talhões de projeto</Text><Text style={styles.value}>{projetoTalhoes.length}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Área total</Text><Text style={styles.value}>{fazenda.areaTotalHa.toLocaleString('pt-BR')} ha</Text></View>
          <View style={styles.row}><Text style={styles.label}>VCUs emitidos (ano atual)</Text><Text style={styles.value}>{fmt(totalVcus)} tCO₂e</Text></View>
          {baseline && <View style={styles.row}><Text style={styles.label}>Baseline (ano zero)</Text><Text style={styles.value}>{fmt(totalBaseline)} tCO₂e</Text></View>}
          <View style={styles.row}><Text style={styles.label}>Créditos gerados (delta)</Text><Text style={styles.value}>{fmt(baseline ? creditos : totalVcus)} tCO₂e</Text></View>
        </View>

        {/* Talhões */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Talhões do Projeto</Text>
          <View style={styles.table}>
            <View style={styles.tableHead}>
              <Text style={[styles.col1, { fontFamily: 'Helvetica-Bold', fontSize: 8 }]}>Talhão</Text>
              <Text style={[styles.col2, { fontFamily: 'Helvetica-Bold', fontSize: 8 }]}>Área (ha)</Text>
              <Text style={[styles.col2, { fontFamily: 'Helvetica-Bold', fontSize: 8 }]}>SOC (%)</Text>
              <Text style={[styles.col2, { fontFamily: 'Helvetica-Bold', fontSize: 8 }]}>VCUs</Text>
            </View>
            {projetoTalhoes.map(t => {
              const r = resultados.find(x => x.talhaoId === t.id)
              return (
                <View key={t.id} style={styles.tableRow}>
                  <Text style={styles.col1}>{t.nome}</Text>
                  <Text style={styles.col2}>{t.areaHa}</Text>
                  <Text style={styles.col2}>{t.socPercent ?? '—'}</Text>
                  <Text style={styles.col2}>{r ? fmt(r.vcusEmitidosTotal) : '—'}</Text>
                </View>
              )
            })}
          </View>
        </View>

        {/* Dados de Solo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados de Solo (inseridos pelo admin)</Text>
          <View style={styles.table}>
            <View style={styles.tableHead}>
              <Text style={[styles.col1, { fontFamily: 'Helvetica-Bold', fontSize: 8 }]}>Talhão</Text>
              <Text style={[styles.col2, { fontFamily: 'Helvetica-Bold', fontSize: 8 }]}>SOC (%)</Text>
              <Text style={[styles.col2, { fontFamily: 'Helvetica-Bold', fontSize: 8 }]}>BD (g/cm³)</Text>
              <Text style={[styles.col2, { fontFamily: 'Helvetica-Bold', fontSize: 8 }]}>Argila (%)</Text>
            </View>
            {projetoTalhoes.map(t => (
              <View key={t.id} style={styles.tableRow}>
                <Text style={styles.col1}>{t.nome}</Text>
                <Text style={styles.col2}>{t.socPercent ?? '—'}</Text>
                <Text style={styles.col2}>{t.bdGCm3 ?? '—'}</Text>
                <Text style={styles.col2}>{t.argilaPercent ?? '—'}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Racional de Carbono */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Racional de Carbono — VM0042</Text>
          <View style={styles.deltaBox}>
            <Text style={styles.deltaTitle}>Cálculo de Créditos Gerados</Text>
            <View style={styles.deltaRow}>
              <Text>+ Resultado ano atual</Text>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>{fmt(totalVcus)} tCO₂e</Text>
            </View>
            {baseline && (
              <View style={styles.deltaRow}>
                <Text>− Baseline (ano zero) — {new Date(baseline.submetidaEm).toLocaleDateString('pt-BR')}</Text>
                <Text style={{ fontFamily: 'Helvetica-Bold', color: '#c00' }}>−{fmt(totalBaseline)} tCO₂e</Text>
              </View>
            )}
            <View style={styles.deltaTotalRow}>
              <Text style={styles.deltaTotalLabel}>= Créditos gerados (delta)</Text>
              <Text style={styles.deltaTotalValue}>{fmt(baseline ? creditos : totalVcus)} tCO₂e</Text>
            </View>
          </View>
        </View>

        {/* Rodapé */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Venture Carbon · Dossiê gerado em {geradoEm}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

export async function gerarDossiePDF(props: Props): Promise<Blob> {
  return pdf(<DossieFazenda {...props} />).toBlob()
}
