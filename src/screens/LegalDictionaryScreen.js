import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Card from '../components/Card';
import { SIZES } from '../utils/theme';
import { useTheme } from '../context/ThemeContext';
import { buscarEnTodosLosCodigos, CODIGOS, CATEGORIAS_POR_CODIGO, obtenerArticulosRelacionados, obtenerInfoCodigo } from '../data/diccionarioJuridico';
import { generateCodePDF, sharePDF } from '../services/pdfGenerator';

const CODIGOS_DISPONIBLES = [
  { key: 'constitucion', label: 'Constitución', icon: '📜', color: '#1A237E', desc: 'Derechos y organización del Estado' },
  { key: 'civil', label: 'Código Civil', icon: '📖', color: '#1976D2', desc: 'Personas, bienes, obligaciones y sucesiones' },
  { key: 'penal', label: 'Código Penal', icon: '⚖️', color: '#D32F2F', desc: 'Delitos, penas y principios penales' },
  { key: 'laboral', label: 'Código de Trabajo', icon: '👷', color: '#388E3C', desc: 'Derechos laborales y prestaciones' },
  { key: 'comercio', label: 'Código de Comercio', icon: '🏢', color: '#F57C00', desc: 'Sociedades, títulos y contratos' },
  { key: 'familia', label: 'Código de Familia', icon: '👨‍👩‍👧‍👦', color: '#E91E63', desc: 'Matrimonio, filiación y alimentos' },
  { key: 'fiscal', label: 'Código Fiscal', icon: '💰', color: '#7B1FA2', desc: 'Impuestos, renta y tributos' },
  { key: 'especiales', label: 'Leyes Especiales', icon: '📋', color: '#00897B', desc: 'Ambiental, consumidor, bancario y más' },
  { key: 'normas', label: 'Normas Internacionales', icon: '🌐', color: '#5C6BC0', desc: 'Tratados, OEA, ONU, OIT, DIH' },
  { key: 'decretos', label: 'Decretos Importantes', icon: '📝', color: '#6D4C41', desc: 'Decretos ejecutivos y de gabinete' },
  { key: 'acuerdos', label: 'Acuerdos y Resoluciones', icon: '🤝', color: '#C5A028', desc: 'Acuerdos de gabinete y regulatorios' },
  { key: 'competencia', label: 'Libre Competencia', icon: '🏛️', color: '#37474F', desc: 'CLICAC, monopolios y consumidor' },
  { key: 'tribunales', label: 'Tribunales y Juzgados', icon: '⚡', color: '#1565C0', desc: 'Organización del sistema judicial' },
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

const getCategoriaCount = (key, categoria) => {
  return (CODIGOS[key]?.articulos || []).filter((a) => a.categoria === categoria).length;
};

const highlightText = (text, searchTerm) => {
  if (!searchTerm || !text) return text;
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '***$1***');
};

const LegalDictionaryScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [selectedCode, setSelectedCode] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [viewArticle, setViewArticle] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollRef = useRef(null);

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

  const renderSearchBar = (placeholder, extraActions) => (
    <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={styles.searchIcon}>🔍</Text>
      <TextInput
        style={[styles.searchInput, { color: colors.text }]}
        placeholder={placeholder}
        placeholderTextColor={colors.disabled}
        value={search}
        onChangeText={handleSearch}
      />
      {search ? (
        <TouchableOpacity onPress={() => { setSearch(''); setShowSuggestions(true); }}>
          <Text style={[styles.clearBtn, { color: colors.textSecondary }]}>✕</Text>
        </TouchableOpacity>
      ) : null}
      {extraActions}
    </View>
  );

  const CodeInfoHeader = ({ codeKey }) => {
    const codeInfo = CODIGOS_DISPONIBLES.find((c) => c.key === codeKey);
    const info = obtenerInfoCodigo(codeKey);
    if (!codeInfo) return null;
    return (
      <View style={[styles.codeInfoHeader, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <View style={styles.codeInfoRow}>
          <View style={[styles.codeInfoIconBg, { backgroundColor: codeInfo.color + '20' }]}>
            <Text style={styles.codeInfoIcon}>{codeInfo.icon}</Text>
          </View>
          <View style={styles.codeInfoText}>
            <Text style={[styles.codeInfoTitle, { color: colors.text }]}>{codeInfo.label}</Text>
            <Text style={[styles.codeInfoDesc, { color: colors.textSecondary }]}>{codeInfo.desc}</Text>
          </View>
        </View>
        {info && (
          <View style={styles.codeInfoMeta}>
            <View style={styles.codeMetaRow}>
              <View style={[styles.codeMetaBadge, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles.codeMetaBadgeText, { color: colors.primary }]}>Ley de {info.anio}</Text>
              </View>
              <View style={[styles.codeMetaBadge, { backgroundColor: colors.success + '15' }]}>
                <Text style={[styles.codeMetaBadgeText, { color: colors.success }]}>Última reforma: {info.ultimaReforma}</Text>
              </View>
            </View>
            {info.conceptosClave && (
              <View style={styles.codeConcepts}>
                <Text style={[styles.codeConceptsLabel, { color: colors.textSecondary }]}>Conceptos clave:</Text>
                <View style={styles.codeConceptsRow}>
                  {info.conceptosClave.map((c, i) => (
                    <View key={i} style={[styles.conceptChip, { backgroundColor: colors.overlay }]}>
                      <Text style={[styles.conceptChipText, { color: colors.textSecondary }]}>{c}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  if (!selectedCode) {
    const hasResults = search.trim().length > 0 && totalResults > 0;
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.headerBg, paddingTop: insets.top + 16 }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
              <Text style={styles.headerBackText}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerTextCol}>
              <Text style={styles.headerTitle}>Leyes de Panamá</Text>
              <Text style={styles.headerSubtitle}>Consulta todo el ordenamiento jurídico</Text>
            </View>
          </View>
        </View>
        {renderSearchBar('Buscar en todas las leyes...')}
        {showSuggestions && !search && (
          <ScrollView horizontal style={styles.suggestionsRow} showsHorizontalScrollIndicator={false}>
            {SUGERENCIAS.map((s) => (
              <TouchableOpacity key={s.term} style={[styles.suggestionChip, { backgroundColor: colors.primary + '25', borderColor: colors.primary + '40' }]}
                onPress={() => { setSearch(s.term); setShowSuggestions(false); }}>
                <Text style={[styles.suggestionText, { color: colors.primary }]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        {hasResults ? (
          <FlatList
            data={Object.entries(results).flatMap(([code, articles]) =>
              articles.map((a) => ({ ...a, codigoKey: code }))
            )}
            renderItem={({ item }) => {
              const codeInfo = CODIGOS_DISPONIBLES.find((c) => c.key === item.codigoKey);
              return (
                <TouchableOpacity onPress={() => handleViewArticle(item.codigoKey, item)}>
                  <Card
                    icon={codeInfo?.icon || '📖'}
                    title={`Art. ${item.articulo} - ${item.titulo}`}
                    subtitle={`${codeInfo?.label || item.codigoKey} • ${item.categoria}`}
                    badge={item.categoria}
                  >
                    <Text style={[styles.articleText, { color: colors.textSecondary }]}>
                      {search.trim() ? highlightText(item.contenido, search) : item.contenido}
                    </Text>
                  </Card>
                </TouchableOpacity>
              );
            }}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Card><Text style={[styles.noData, { color: colors.textSecondary }]}>Sin resultados. Intente otro término.</Text></Card>
            }
          />
        ) : search ? (
          <Card><Text style={[styles.noData, { color: colors.textSecondary }]}>Sin resultados. Intente otro término.</Text></Card>
        ) : (
          <ScrollView contentContainerStyle={styles.gridContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Códigos y Leyes</Text>
            <View style={styles.codeGrid}>
              {CODIGOS_DISPONIBLES.map((code) => (
                <TouchableOpacity key={code.key} style={[styles.codeCard, { backgroundColor: colors.surface, shadowColor: colors.cardShadow, borderColor: code.color + '30' }]}
                  onPress={() => { setSelectedCode(code.key); setShowSuggestions(true); }}>
                  <View style={[styles.codeCardAccent, { backgroundColor: code.color }]} />
                  <View style={styles.codeCardContent}>
                    <Text style={styles.codeIcon}>{code.icon}</Text>
                    <Text style={[styles.codeLabel, { color: colors.text }]}>{code.label}</Text>
                    <Text style={[styles.codeDesc, { color: colors.textSecondary }]}>{code.desc}</Text>
                    <View style={styles.codeCardFooter}>
                      <Text style={[styles.codeCount, { color: code.color }]}>{getTotalArticulos(code.key)} artículos</Text>
                      <Text style={styles.codeArrow}>›</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    );
  }

  if (!selectedCategory && !viewArticle) {
    const codigo = CODIGOS[selectedCode];
    const categorias = CATEGORIAS_POR_CODIGO[selectedCode] || [];
    const codeInfo = CODIGOS_DISPONIBLES.find((c) => c.key === selectedCode);
    const articulosFiltrados = search.trim()
      ? Object.values(results).flat()
      : [];

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.headerBg, paddingTop: insets.top + 16 }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={handleBack} style={styles.headerBack}>
              <Text style={styles.headerBackText}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerTextCol}>
              <Text style={styles.headerTitle}>{getTitle()}</Text>
              <Text style={styles.headerSubtitle}>{codigo?.articulos?.length || 0} artículos • {categorias.length} categorías</Text>
            </View>
          </View>
        </View>
        {renderSearchBar(`Buscar en ${codeInfo?.label}...`, (
          <TouchableOpacity onPress={handleGeneratePDF} style={[styles.pdfBtn, { backgroundColor: colors.primary + '25' }]}>
            <Text style={styles.pdfBtnText}>📄</Text>
          </TouchableOpacity>
        ))}
        {codigo && <CodeInfoHeader codeKey={selectedCode} />}
        <Text style={[styles.sectionTitle, { color: colors.text, marginHorizontal: SIZES.padding }]}>
          {search.trim() ? `Resultados (${totalResults})` : 'Categorías'}
        </Text>
        <FlatList
          data={search.trim() ? articulosFiltrados : categorias}
          renderItem={({ item }) =>
            search.trim() ? (
              <TouchableOpacity onPress={() => handleViewArticle(selectedCode, item)}>
                <Card icon={codeInfo?.icon || '📖'} title={`Art. ${item.articulo} - ${item.titulo}`} subtitle={item.categoria} badge={item.categoria}>
                  <Text style={[styles.articleText, { color: colors.textSecondary }]}>{item.contenido}</Text>
                </Card>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setSelectedCategory(item)}>
                <Card
                  icon="📂"
                  title={item}
                  subtitle={`${getCategoriaCount(selectedCode, item)} artículos`}
                  badge={`${getCategoriaCount(selectedCode, item)}`}
                />
              </TouchableOpacity>
            )
          }
          keyExtractor={(item, i) => item.id || item + i}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Card><Text style={[styles.noData, { color: colors.textSecondary }]}>No hay artículos en esta categoría.</Text></Card>
          }
        />
      </View>
    );
  }

  if (viewArticle) {
    const codeInfo = CODIGOS_DISPONIBLES.find((c) => c.key === viewArticle.codigo);
    const relatedArticles = obtenerArticulosRelacionados(viewArticle.codigo, viewArticle.articulo.id);
    const codigo = CODIGOS[viewArticle.codigo];
    const articulos = codigo?.articulos || [];
    const currentIndex = articulos.findIndex((a) => a.id === viewArticle.articulo.id);
    const prevArticle = currentIndex > 0 ? articulos[currentIndex - 1] : null;
    const nextArticle = currentIndex < articulos.length - 1 ? articulos[currentIndex + 1] : null;

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.headerBg, paddingTop: insets.top + 16 }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={handleBack} style={styles.headerBack}>
              <Text style={styles.headerBackText}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerTextCol}>
              <Text style={styles.headerTitle}>Artículo {viewArticle.articulo.articulo}</Text>
              <Text style={styles.headerSubtitle}>{codeInfo?.label}</Text>
            </View>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.articleDetail} ref={scrollRef}>
          <View style={[styles.articleCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <View style={styles.articleHeader}>
              <View style={[styles.articleNumBadge, { backgroundColor: (codeInfo?.color || colors.primary) + '20' }]}>
                <Text style={[styles.articleNum, { color: codeInfo?.color || colors.primary }]}>Art. {viewArticle.articulo.articulo}</Text>
              </View>
              {viewArticle.articulo.categoria && (
                <View style={[styles.articleCatBadge, { backgroundColor: colors.overlay }]}>
                  <Text style={[styles.articleCatText, { color: colors.textSecondary }]}>{viewArticle.articulo.categoria}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.articleTitle, { color: colors.text }]}>{viewArticle.articulo.titulo}</Text>
            <View style={[styles.articleDivider, { backgroundColor: colors.border }]} />
            <Text style={[styles.articleFullText, { color: colors.text }]}>{viewArticle.articulo.contenido}</Text>
            <View style={styles.articleMeta}>
              <Text style={[styles.articleMetaItem, { color: colors.textSecondary, backgroundColor: colors.overlay }]}>
                {codeInfo?.label}
              </Text>
              {viewArticle.articulo.libro && (
                <Text style={[styles.articleMetaItem, { color: colors.textSecondary, backgroundColor: colors.overlay }]}>
                  {viewArticle.articulo.libro}
                </Text>
              )}
              <Text style={[styles.articleMetaItem, { color: colors.textSecondary, backgroundColor: colors.overlay }]}>
                {viewArticle.articulo.categoria}
              </Text>
            </View>
          </View>

          {(prevArticle || nextArticle) && (
            <View style={styles.articleNav}>
              {prevArticle ? (
                <TouchableOpacity
                  style={[styles.articleNavBtn, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
                  onPress={() => handleViewArticle(viewArticle.codigo, prevArticle)}
                >
                  <Text style={styles.articleNavIcon}>‹</Text>
                  <View style={styles.articleNavText}>
                    <Text style={[styles.articleNavLabel, { color: colors.textSecondary }]}>Anterior</Text>
                    <Text style={[styles.articleNavTitle, { color: colors.text }]} numberOfLines={1}>Art. {prevArticle.articulo}</Text>
                  </View>
                </TouchableOpacity>
              ) : <View style={{ flex: 1 }} />}
              {nextArticle ? (
                <TouchableOpacity
                  style={[styles.articleNavBtn, styles.articleNavBtnRight, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
                  onPress={() => handleViewArticle(viewArticle.codigo, nextArticle)}
                >
                  <View style={styles.articleNavText}>
                    <Text style={[styles.articleNavLabel, { color: colors.textSecondary }]}>Siguiente</Text>
                    <Text style={[styles.articleNavTitle, { color: colors.text }]} numberOfLines={1}>Art. {nextArticle.articulo}</Text>
                  </View>
                  <Text style={styles.articleNavIcon}>›</Text>
                </TouchableOpacity>
              ) : <View style={{ flex: 1 }} />}
            </View>
          )}

          {relatedArticles.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={[styles.relatedTitle, { color: colors.text }]}>Artículos relacionados</Text>
              {relatedArticles.map((ra) => (
                <TouchableOpacity key={ra.id} onPress={() => handleViewArticle(viewArticle.codigo, ra)}>
                  <View style={[styles.relatedCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                    <Text style={[styles.relatedNum, { color: codeInfo?.color || colors.primary }]}>Art. {ra.articulo}</Text>
                    <View style={styles.relatedInfo}>
                      <Text style={[styles.relatedLabel, { color: colors.text }]} numberOfLines={1}>{ra.titulo}</Text>
                      <Text style={[styles.relatedPreview, { color: colors.textSecondary }]} numberOfLines={2}>{ra.contenido}</Text>
                    </View>
                    <Text style={styles.relatedArrow}>›</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  const codeInfo = CODIGOS_DISPONIBLES.find((c) => c.key === selectedCode);
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBg, paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack} style={styles.headerBack}>
            <Text style={styles.headerBackText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>{getTitle()}</Text>
            <Text style={styles.headerSubtitle}>{totalResults} artículos encontrados</Text>
          </View>
        </View>
      </View>
      <FlatList
        data={Object.values(results).flat()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleViewArticle(selectedCode, item)}>
            <Card icon={codeInfo?.icon || '📖'} title={`Art. ${item.articulo} - ${item.titulo}`} subtitle={item.categoria} badge={item.categoria}>
              <Text style={[styles.articleText, { color: colors.textSecondary }]}>{item.contenido}</Text>
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
  container: { flex: 1 },
  header: {
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerBack: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  headerBackText: { fontSize: 22, color: '#FFFFFF', fontWeight: 'bold' },
  headerTextCol: { flex: 1 },
  headerTitle: { fontSize: SIZES.xl, fontWeight: 'bold', color: '#FFFFFF' },
  headerSubtitle: { fontSize: SIZES.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    margin: SIZES.padding, borderRadius: 12, paddingHorizontal: 12, height: 45,
    borderWidth: 1,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: SIZES.md, height: 45 },
  clearBtn: { fontSize: 16, padding: 4 },
  suggestionsRow: { paddingHorizontal: SIZES.padding, marginBottom: 8 },
  suggestionChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
    marginRight: 8, borderWidth: 1,
  },
  suggestionText: { fontSize: SIZES.xs, fontWeight: '500' },
  list: { padding: SIZES.padding, paddingBottom: 40 },
  gridContainer: { padding: SIZES.padding },
  sectionTitle: {
    fontSize: SIZES.lg, fontWeight: 'bold',
    marginTop: 8, marginBottom: 12,
  },
  codeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  codeCard: {
    width: '47%', borderRadius: 16, overflow: 'hidden',
    marginBottom: 8, borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 3,
  },
  codeCardAccent: { height: 4 },
  codeCardContent: { padding: 14 },
  codeIcon: { fontSize: 28, marginBottom: 6 },
  codeLabel: { fontSize: SIZES.md, fontWeight: '700', marginTop: 2 },
  codeDesc: { fontSize: SIZES.xs, marginTop: 3, lineHeight: 16 },
  codeCardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 10,
  },
  codeCount: { fontSize: SIZES.xs, fontWeight: '600' },
  codeArrow: { fontSize: 18, color: '#BDBDBD' },
  articleText: { fontSize: SIZES.sm, marginTop: 4, fontStyle: 'italic' },
  noData: { textAlign: 'center', padding: 20, fontSize: SIZES.sm },
  pdfBtn: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginLeft: 8,
  },
  pdfBtnText: { fontSize: 18 },
  codeInfoHeader: {
    marginHorizontal: SIZES.padding,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
  },
  codeInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  codeInfoIconBg: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  codeInfoIcon: { fontSize: 26 },
  codeInfoText: { flex: 1 },
  codeInfoTitle: { fontSize: SIZES.md, fontWeight: '700' },
  codeInfoDesc: { fontSize: SIZES.xs, marginTop: 2 },
  codeInfoMeta: { marginTop: 12 },
  codeMetaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  codeMetaBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8,
  },
  codeMetaBadgeText: { fontSize: SIZES.xs, fontWeight: '500' },
  codeConcepts: { marginTop: 10 },
  codeConceptsLabel: { fontSize: SIZES.xs, fontWeight: '500', marginBottom: 6 },
  codeConceptsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  conceptChip: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6,
  },
  conceptChipText: { fontSize: SIZES.xs },
  articleDetail: { padding: SIZES.padding, paddingBottom: 40 },
  articleCard: {
    borderRadius: 16, borderWidth: 1, padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  articleHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, marginBottom: 12, flexWrap: 'wrap',
  },
  articleNumBadge: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8,
  },
  articleNum: { fontSize: SIZES.sm, fontWeight: '700' },
  articleCatBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
  },
  articleCatText: { fontSize: SIZES.xs, fontWeight: '500' },
  articleTitle: {
    fontSize: SIZES.lg, fontWeight: 'bold', lineHeight: 24,
  },
  articleDivider: { height: 1, marginVertical: 14 },
  articleFullText: {
    fontSize: SIZES.md, lineHeight: 26, textAlign: 'justify',
  },
  articleMeta: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16,
  },
  articleMetaItem: {
    fontSize: SIZES.xs,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 6,
  },
  articleNav: {
    flexDirection: 'row', gap: 10, marginTop: 16,
  },
  articleNavBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: 14, borderWidth: 1, gap: 8,
  },
  articleNavBtnRight: { flexDirection: 'row-reverse' },
  articleNavIcon: { fontSize: 24, color: '#BDBDBD', fontWeight: 'bold' },
  articleNavText: { flex: 1 },
  articleNavLabel: { fontSize: SIZES.xs, fontWeight: '500' },
  articleNavTitle: { fontSize: SIZES.sm, fontWeight: '600', marginTop: 1 },
  relatedSection: { marginTop: 20 },
  relatedTitle: { fontSize: SIZES.lg, fontWeight: 'bold', marginBottom: 10 },
  relatedCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8,
    gap: 12,
  },
  relatedNum: { fontSize: SIZES.sm, fontWeight: '700', minWidth: 50 },
  relatedInfo: { flex: 1 },
  relatedLabel: { fontSize: SIZES.sm, fontWeight: '600' },
  relatedPreview: { fontSize: SIZES.xs, marginTop: 2 },
  relatedArrow: { fontSize: 20, color: '#BDBDBD' },
});

export default LegalDictionaryScreen;
