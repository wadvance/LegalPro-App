import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import Card from '../components/Card';
import Header from '../components/Header';
import { COLORS, SIZES } from '../utils/theme';
import { buscarEnTodosLosCodigos, CODIGOS, CATEGORIAS_POR_CODIGO } from '../data/diccionarioJuridico';
import { generateCodePDF, sharePDF } from '../services/pdfGenerator';

const CODIGOS_DISPONIBLES = [
  { key: 'constitucion', label: 'Constitución', icon: '📜', desc: 'Derechos y organización del Estado' },
  { key: 'civil', label: 'Código Civil', icon: '📖', desc: 'Personas, bienes, obligaciones y sucesiones' },
  { key: 'penal', label: 'Código Penal', icon: '⚖️', desc: 'Delitos, penas y principios penales' },
  { key: 'laboral', label: 'Código de Trabajo', icon: '👷', desc: 'Derechos laborales y prestaciones' },
  { key: 'comercio', label: 'Código de Comercio', icon: '🏢', desc: 'Sociedades, títulos y contratos' },
  { key: 'familia', label: 'Código de Familia', icon: '👨‍👩‍👧‍👦', desc: 'Matrimonio, filiación y alimentos' },
  { key: 'fiscal', label: 'Código Fiscal', icon: '💰', desc: 'Impuestos, renta y tributos' },
  { key: 'especiales', label: 'Leyes Especiales', icon: '📋', desc: 'Ambiental, consumidor, bancario y más' },
  { key: 'normas', label: 'Normas Internacionales', icon: '🌐', desc: 'Tratados, OEA, ONU, OIT, DIH' },
  { key: 'decretos', label: 'Decretos Importantes', icon: '📝', desc: 'Decretos ejecutivos y de gabinete' },
  { key: 'acuerdos', label: 'Acuerdos y Resoluciones', icon: '🤝', desc: 'Acuerdos de gabinete y regulatorios' },
  { key: 'competencia', label: 'Libre Competencia', icon: '🏛️', desc: 'CLICAC, monopolios y consumidor' },
  { key: 'tribunales', label: 'Tribunales y Juzgados', icon: '⚡', desc: 'Organización del sistema judicial' },
];

const SUGERENCIAS = [
  { term: 'divorcio', label: 'Divorcio' },
  { term: 'despido', label: 'Despido laboral' },
  { term: 'salario minimo', label: 'Salario mínimo' },
  { term: 'homicidio', label: 'Homicidio' },
  { term: 'propiedad', label: 'Derecho de propiedad' },
  { term: 'sociedad anonima', label: 'Sociedad anónima' },
];

const getTotalArticulos = (key) => CODIGOS[key]?.articulos?.length || 0;

const LegalDictionaryScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [selectedCode, setSelectedCode] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [viewArticle, setViewArticle] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const results = useMemo(() => {
    if (viewArticle) return { [viewArticle.codigo]: [viewArticle.articulo] };
    if (selectedCode && selectedCategory) {
      const codigo = CODIGOS[selectedCode];
      const articulos = codigo?.articulos?.filter((a) => a.categoria === selectedCategory) || [];
      return { [selectedCode]: articulos };
    }
    if (selectedCode) {
      const codigo = CODIGOS[selectedCode];
      return { [selectedCode]: codigo?.articulos || [] };
    }
    if (search.trim().length > 0) {
      return buscarEnTodosLosCodigos(search);
    }
    return {};
  }, [search, selectedCode, selectedCategory, viewArticle]);

  const totalResults = Object.values(results).reduce((s, arr) => s + arr.length, 0);

  const handleViewArticle = (codigoKey, articulo) => {
    setViewArticle({ codigo: codigoKey, articulo });
  };

  const handleBack = () => {
    if (viewArticle) { setViewArticle(null); return; }
    if (selectedCategory) { setSelectedCategory(null); return; }
    if (selectedCode) { setSelectedCode(null); return; }
    navigation.goBack();
  };

  const getTitle = () => {
    if (viewArticle) return `Art. ${viewArticle.articulo.articulo}`;
    if (selectedCategory) return selectedCategory;
    if (selectedCode) return CODIGOS_DISPONIBLES.find((c) => c.key === selectedCode)?.label || '';
    return 'Leyes de Panamá';
  };

  const handleSearch = (text) => {
    setSearch(text);
    setShowSuggestions(text.length === 0);
  };

  if (!selectedCode) {
    const hasResults = search.trim().length > 0 && totalResults > 0;
    return (
      <View style={styles.container}>
        <Header title="Leyes de Panamá" onBack={() => navigation.goBack()} />
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput style={styles.searchInput} placeholder="Buscar en todas las leyes..."
            value={search} onChangeText={handleSearch} placeholderTextColor={COLORS.disabled} />
          {search ? (
            <TouchableOpacity onPress={() => { setSearch(''); setShowSuggestions(true); }}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {showSuggestions && !search && (
          <ScrollView horizontal style={styles.suggestionsRow} showsHorizontalScrollIndicator={false}>
            {SUGERENCIAS.map((s) => (
              <TouchableOpacity key={s.term} style={styles.suggestionChip}
                onPress={() => { setSearch(s.term); setShowSuggestions(false); }}>
                <Text style={styles.suggestionText}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {hasResults ? (
          <FlatList
            data={Object.entries(results).flatMap(([code, articles]) =>
              articles.map((a) => ({ ...a, codigoKey: code }))
            )}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleViewArticle(item.codigoKey, item)}>
                <Card icon="📖" title={`Art. ${item.articulo} - ${item.titulo}`}
                  subtitle={`${CODIGOS_DISPONIBLES.find((c) => c.key === item.codigoKey)?.label} • ${item.categoria}`}>
                  <Text style={styles.articleText}>{item.contenido}</Text>
                </Card>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Card><Text style={styles.noData}>Sin resultados. Intente otro término.</Text></Card>}
          />
        ) : search ? (
          <Card><Text style={styles.noData}>Sin resultados. Intente otro término.</Text></Card>
        ) : (
          <ScrollView contentContainerStyle={styles.gridContainer}>
            <Text style={styles.sectionTitle}>Códigos y Leyes</Text>
            <View style={styles.codeGrid}>
              {CODIGOS_DISPONIBLES.map((code) => (
                <TouchableOpacity key={code.key} style={styles.codeCard}
                  onPress={() => { setSelectedCode(code.key); setShowSuggestions(true); }}>
                  <Text style={styles.codeIcon}>{code.icon}</Text>
                  <Text style={styles.codeLabel}>{code.label}</Text>
                  <Text style={styles.codeDesc}>{code.desc}</Text>
                  <Text style={styles.codeCount}>{getTotalArticulos(code.key)} artículos</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    );
  }

  const handleGeneratePDF = async () => {
    const codeData = CODIGOS[selectedCode];
    if (!codeData) return;
    Alert.alert(
      'Generar PDF',
      `¿Descargar ${codeData.titulo} completo (${codeData.articulos?.length || 0} artículos)?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Generar',
          onPress: async () => {
            const result = await generateCodePDF(codeData);
            if (result.success) {
              await sharePDF(result.uri, `${codeData.titulo.replace(/\s+/g, '_')}`);
            }
          },
        },
      ]
    );
  };

  if (!selectedCategory) {
    const codigo = CODIGOS[selectedCode];
    const categorias = CATEGORIAS_POR_CODIGO[selectedCode] || [];
    const articulosFiltrados = search.trim()
      ? Object.values(results).flat()
      : [];

    return (
      <View style={styles.container}>
        <Header title={getTitle()} onBack={handleBack} />
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput style={styles.searchInput}
            placeholder={`Buscar en ${CODIGOS_DISPONIBLES.find((c) => c.key === selectedCode)?.label}...`}
            value={search} onChangeText={setSearch} placeholderTextColor={COLORS.disabled} />
          <TouchableOpacity onPress={handleGeneratePDF} style={styles.pdfBtn}>
            <Text style={styles.pdfBtnText}>📄</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionTitle}>
          {search.trim() ? `Resultados (${totalResults})` : 'Categorías'}
        </Text>
        <FlatList
          data={search.trim() ? articulosFiltrados : categorias}
          renderItem={({ item }) =>
            search.trim() ? (
              <TouchableOpacity onPress={() => handleViewArticle(selectedCode, item)}>
                <Card icon="📖" title={`Art. ${item.articulo} - ${item.titulo}`} subtitle={item.categoria}>
                  <Text style={styles.articleText}>{item.contenido}</Text>
                </Card>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setSelectedCategory(item)}>
                <Card icon="📂" title={item} subtitle={`Ver artículos de ${item}`} />
              </TouchableOpacity>
            )
          }
          keyExtractor={(item, i) => item.id || item + i}
          contentContainerStyle={styles.list}
        />
      </View>
    );
  }

  if (viewArticle) {
    const codeInfo = CODIGOS_DISPONIBLES.find((c) => c.key === viewArticle.codigo);
    return (
      <View style={styles.container}>
        <Header title={getTitle()} onBack={handleBack} />
        <ScrollView contentContainerStyle={styles.list}>
          <Card icon="📖" title={`Artículo ${viewArticle.articulo.articulo}`}
            subtitle={viewArticle.articulo.titulo}
            badge={viewArticle.articulo.categoria}>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>{codeInfo?.label}</Text>
              <Text style={styles.meta}>{viewArticle.articulo.libro}</Text>
            </View>
            <Text style={styles.articleFullText}>{viewArticle.articulo.contenido}</Text>
          </Card>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title={getTitle()} onBack={handleBack} />
      <FlatList
        data={Object.values(results).flat()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleViewArticle(selectedCode, item)}>
            <Card icon="📖" title={`Art. ${item.articulo} - ${item.titulo}`} subtitle={item.categoria}>
              <Text style={styles.articleText}>{item.contenido}</Text>
            </Card>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    margin: SIZES.padding, borderRadius: 12, paddingHorizontal: 12, height: 45,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: SIZES.md, color: COLORS.text },
  clearBtn: { fontSize: 16, color: COLORS.textSecondary, padding: 4 },
  suggestionsRow: { paddingHorizontal: SIZES.padding, marginBottom: 8 },
  suggestionChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
    backgroundColor: COLORS.primary + '15', marginRight: 8,
    borderWidth: 1, borderColor: COLORS.primary + '30',
  },
  suggestionText: { fontSize: SIZES.xs, color: COLORS.primary, fontWeight: '500' },
  list: { padding: SIZES.padding, paddingBottom: 30 },
  gridContainer: { padding: SIZES.padding },
  sectionTitle: {
    fontSize: SIZES.lg, fontWeight: 'bold', color: COLORS.text,
    marginHorizontal: SIZES.padding, marginTop: 8, marginBottom: 10,
  },
  codeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  codeCard: {
    width: '47%', backgroundColor: COLORS.surface, borderRadius: 16,
    padding: 16, marginBottom: 8,
    shadowColor: COLORS.cardShadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4, elevation: 3,
  },
  codeIcon: { fontSize: 32 },
  codeLabel: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.text, marginTop: 6 },
  codeDesc: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  codeCount: { fontSize: SIZES.xs, color: COLORS.primary, marginTop: 6, fontWeight: '500' },
  articleText: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 4, fontStyle: 'italic' },
  articleFullText: { fontSize: SIZES.md, color: COLORS.text, marginTop: 12, lineHeight: 24, textAlign: 'justify' },
  metaRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  meta: { fontSize: SIZES.xs, color: COLORS.textSecondary, backgroundColor: COLORS.background, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  noData: { textAlign: 'center', color: COLORS.textSecondary, padding: 20 },
  pdfBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primary + '15',
    justifyContent: 'center', alignItems: 'center', marginLeft: 8,
  },
  pdfBtnText: { fontSize: 18 },
});

export default LegalDictionaryScreen;
