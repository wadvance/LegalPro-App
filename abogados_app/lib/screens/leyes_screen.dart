import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;

import '../theme/app_theme.dart';

const List<String> kSugerencias = [
  'Divorcio', 'Despido laboral', 'Salario mínimo',
  'Homicidio', 'Derecho de propiedad', 'Sociedad anónima',
];

/// Replica src/screens/LegalDictionaryScreen.js (datos locales en assets).
class LeyesScreen extends StatefulWidget {
  final ThemeController themeController;
  const LeyesScreen({super.key, required this.themeController});

  @override
  State<LeyesScreen> createState() => _LeyesScreenState();
}

class _LeyesScreenState extends State<LeyesScreen> {
  final _busquedaCtrl = TextEditingController();
  String _busqueda = '';
  List<Map<String, dynamic>> _indice = [];
  final Map<String, Map<String, dynamic>> _cache = {};
  String? _codigoSel;
  String? _categoriaSel;
  Map<String, dynamic>? _articulo;
  bool _cargando = true;

  @override
  void initState() {
    super.initState();
    _cargarIndice();
  }

  @override
  void dispose() {
    _busquedaCtrl.dispose();
    super.dispose();
  }

  Future<void> _cargarIndice() async {
    final raw = await rootBundle
        .loadString('assets/data/leyes/indice.json');
    if (!mounted) return;
    setState(() {
      _indice = (jsonDecode(raw) as List).cast<Map<String, dynamic>>();
      _cargando = false;
    });
  }

  Future<Map<String, dynamic>> _codigo(String key) async {
    if (_cache.containsKey(key)) return _cache[key]!;
    final raw = await rootBundle
        .loadString('assets/data/leyes/$key.json');
    final data = jsonDecode(raw) as Map<String, dynamic>;
    _cache[key] = data;
    return data;
  }

  Future<List<Map<String, dynamic>>> _buscarGlobal(String q) async {
    final res = <Map<String, dynamic>>[];
    for (final e in _indice) {
      final cod = await _codigo(e['key'] as String);
      for (final a in (cod['articulos'] as List)) {
        final art = a as Map<String, dynamic>;
        if ('${art['titulo']} ${art['contenido']} ${art['categoria']}'
            .toLowerCase()
            .contains(q)) {
          res.add({...art, '_codigo': e['key'], '_label': e['label']});
        }
      }
    }
    return res;
  }

  List<String> _categorias(Map<String, dynamic> cod) {
    final set = <String>{};
    for (final a in (cod['articulos'] as List)) {
      set.add('${(a as Map)['categoria'] ?? ''}');
    }
    return set.toList()..sort();
  }

  int _conteoCat(Map<String, dynamic> cod, String cat) {
    var n = 0;
    for (final a in (cod['articulos'] as List)) {
      if ('${(a as Map)['categoria'] ?? ''}' == cat) n++;
    }
    return n;
  }

  List<Map<String, dynamic>> _relacionados(
      Map<String, dynamic> cod, Map<String, dynamic> art) {
    return (cod['articulos'] as List)
        .cast<Map<String, dynamic>>()
        .where((a) =>
            a['id'] != art['id'] &&
            '${a['categoria']}' == '${art['categoria']}')
        .take(5)
        .toList();
  }

  void _atras() {
    setState(() {
      if (_articulo != null) {
        _articulo = null;
      } else if (_categoriaSel != null) {
        _categoriaSel = null;
      } else {
        _codigoSel = null;
      }
      _busquedaCtrl.clear();
      _busqueda = '';
    });
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.themeController.colors;

    String titulo = 'Leyes de Panamá';
    String subtitulo = 'Consulta todo el ordenamiento jurídico';
    if (_articulo != null) {
      titulo = 'Artículo ${_articulo!['articulo']}';
      subtitulo = '${_articulo!['_label'] ?? ''}';
    } else if (_codigoSel != null) {
      final e = _indice.firstWhere((x) => x['key'] == _codigoSel,
          orElse: () => {});
      titulo = '${e['label'] ?? ''}';
    }
    if (_categoriaSel != null && _articulo == null) {
      titulo = _categoriaSel!;
    }

    return Scaffold(
      backgroundColor: c.background,
      appBar: AppBar(
        backgroundColor: c.headerBg,
        foregroundColor: Colors.white,
        leading: _codigoSel == null
            ? const BackButton()
            : IconButton(
                icon: const Text('←', style: TextStyle(fontSize: 24)),
                onPressed: _atras,
              ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(titulo),
            Text(subtitulo, style: const TextStyle(fontSize: 12)),
          ],
        ),
      ),
      body: _cargando
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: TextField(
                    controller: _busquedaCtrl,
                    onChanged: (v) =>
                        setState(() => _busqueda = v.trim().toLowerCase()),
                    decoration: InputDecoration(
                      prefixText: '🔍 ',
                      hintText: _codigoSel == null
                          ? 'Buscar en todas las leyes...'
                          : 'Buscar...',
                      suffixIcon: _busqueda.isEmpty
                          ? null
                          : IconButton(
                              icon: const Text('✕'),
                              onPressed: () {
                                _busquedaCtrl.clear();
                                setState(() => _busqueda = '');
                              },
                            ),
                    ),
                  ),
                ),
                if (_codigoSel == null &&
                    _busqueda.isEmpty &&
                    _articulo == null)
                  SizedBox(
                    height: 40,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      padding:
                          const EdgeInsets.symmetric(horizontal: 12),
                      itemCount: kSugerencias.length,
                      separatorBuilder: (_, _) =>
                          const SizedBox(width: 8),
                      itemBuilder: (_, i) => ActionChip(
                        label: Text(kSugerencias[i]),
                        onPressed: () {
                          _busquedaCtrl.text = kSugerencias[i];
                          setState(() => _busqueda =
                              kSugerencias[i].toLowerCase());
                        },
                      ),
                    ),
                  ),
                Expanded(child: _cuerpo(c)),
              ],
            ),
    );
  }

  Widget _cuerpo(AppColors c) {
    if (_articulo != null) {
      return FutureBuilder<Map<String, dynamic>>(
        future: _codigo(_articulo!['_codigo'] as String),
        builder: (_, snap) {
          if (!snap.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          return _vistaArticulo(c, snap.data!, _articulo!);
        },
      );
    }
    if (_codigoSel != null) {
      return FutureBuilder<Map<String, dynamic>>(
        future: _codigo(_codigoSel!),
        builder: (_, snap) {
          if (!snap.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final cod = snap.data!;
          if (_categoriaSel != null) {
            final arts = (cod['articulos'] as List)
                .cast<Map<String, dynamic>>()
                .where((a) =>
                    '${a['categoria']}' == _categoriaSel &&
                    (_busqueda.isEmpty ||
                        '${a['titulo']} ${a['contenido']}'
                            .toLowerCase()
                            .contains(_busqueda)))
                .toList();
            return _listaArticulos(
                c, arts, _codigoSel!, '${_indice.firstWhere(
                      (x) => x['key'] == _codigoSel)['label']}',
                vacio: 'No hay artículos en esta categoría.');
          }
          if (_busqueda.isNotEmpty) {
            final arts = (cod['articulos'] as List)
                .cast<Map<String, dynamic>>()
                .where((a) =>
                    '${a['titulo']} ${a['contenido']} ${a['categoria']}'
                        .toLowerCase()
                        .contains(_busqueda))
                .toList();
            return _listaArticulos(
                c, arts, _codigoSel!, '',
                tituloSeccion: 'Resultados (${arts.length})');
          }
          final cats = _categorias(cod);
          return ListView(
            padding: const EdgeInsets.all(12),
            children: [
              _encabezadoCodigo(c, cod),
              const SizedBox(height: 12),
              Text('Categorías',
                  style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: c.text)),
              const SizedBox(height: 8),
              ...cats.map((cat) => Card(
                    child: ListTile(
                      leading: const Text('📂',
                          style: TextStyle(fontSize: 24)),
                      title: Text(cat),
                      subtitle:
                          Text('${_conteoCat(cod, cat)} artículos'),
                      trailing: const Text('›'),
                      onTap: () =>
                          setState(() => _categoriaSel = cat),
                    ),
                  )),
            ],
          );
        },
      );
    }
    if (_busqueda.isNotEmpty) {
      return FutureBuilder<List<Map<String, dynamic>>>(
        future: _buscarGlobal(_busqueda),
        builder: (_, snap) {
          if (!snap.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.data!.isEmpty) {
            return const Center(
                child: Text('Sin resultados. Intente otro término.'));
          }
          return _listaArticulos(c, snap.data!, '', '');
        },
      );
    }
    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        Text('Códigos y Leyes',
            style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
                color: c.text)),
        const SizedBox(height: 8),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate:
              const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 1.2),
          itemCount: _indice.length,
          itemBuilder: (_, i) {
            final e = _indice[i];
            return Card(
              child: InkWell(
                onTap: () =>
                    setState(() => _codigoSel = e['key'] as String),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text('${e['icon']}',
                              style:
                                  const TextStyle(fontSize: 24)),
                          const Spacer(),
                          const Text('›'),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text('${e['label']}',
                          style: const TextStyle(
                              fontWeight: FontWeight.bold)),
                      Text('${e['descripcion'] ?? ''}',
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                              fontSize: 11,
                              color: c.textSecondary)),
                      Text('${e['total'] ?? 0} artículos',
                          style: TextStyle(
                              fontSize: 11,
                              color: c.textSecondary)),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _encabezadoCodigo(AppColors c, Map<String, dynamic> cod) {
    final info = (cod['info'] as Map?) ?? {};
    final conceptos =
        ((info['conceptosClave'] as List?) ?? []).cast();
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('${cod['titulo'] ?? ''}',
                style: const TextStyle(
                    fontWeight: FontWeight.bold, fontSize: 16)),
            Text('${cod['descripcion'] ?? ''}',
                style: TextStyle(color: c.textSecondary)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [
                if ('${info['anio'] ?? ''}'.isNotEmpty)
                  Chip(label: Text('Ley de ${info['anio']}')),
                if ('${info['ultimaReforma'] ?? ''}'.isNotEmpty)
                  Chip(
                      label: Text(
                          'Última reforma: ${info['ultimaReforma']}')),
              ],
            ),
            if (conceptos.isNotEmpty) ...[
              const SizedBox(height: 8),
              const Text('Conceptos clave:'),
              Wrap(
                spacing: 6,
                children: conceptos
                    .map((k) => ActionChip(
                          label: Text('$k'),
                          onPressed: () {
                            _busquedaCtrl.text = '$k';
                            setState(() =>
                                _busqueda = '$k'.toLowerCase());
                          },
                        ))
                    .toList(),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _listaArticulos(
      AppColors c, List<Map<String, dynamic>> arts, String codigoKey,
      String label,
      {String? tituloSeccion, String vacio = ''}) {
    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: arts.length + (tituloSeccion != null ? 1 : 0),
      itemBuilder: (_, i) {
        if (tituloSeccion != null && i == 0) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(tituloSeccion,
                style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: c.text)),
          );
        }
        final a = arts[tituloSeccion != null ? i - 1 : i];
        return Card(
          child: ListTile(
            title: Text('Art. ${a['articulo']} - ${a['titulo']}'),
            subtitle: Text(
                '${a['_label'] ?? label} • ${a['categoria'] ?? ''}',
                maxLines: 2,
                overflow: TextOverflow.ellipsis),
            onTap: () => setState(() {
              _articulo = {
                ...a,
                '_codigo': a['_codigo'] ?? codigoKey,
                '_label': a['_label'] ?? label,
              };
            }),
          ),
        );
      },
    );
  }

  Widget _vistaArticulo(AppColors c, Map<String, dynamic> cod,
      Map<String, dynamic> art) {
    final rel = _relacionados(cod, art);
    return SingleChildScrollView(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 8,
                    children: [
                      Chip(label: Text('Art. ${art['articulo']}')),
                      Chip(label: Text('${art['categoria'] ?? ''}')),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text('${art['titulo'] ?? ''}',
                      style: const TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 18)),
                  const Divider(),
                  Text('${art['contenido'] ?? ''}',
                      textAlign: TextAlign.justify),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    children: [
                      Chip(label: Text('${art['_label'] ?? ''}')),
                      if ('${art['libro'] ?? ''}'.isNotEmpty)
                        Chip(label: Text('${art['libro']}')),
                    ],
                  ),
                ],
              ),
            ),
          ),
          if (rel.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text('Artículos relacionados',
                style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: c.text)),
            const SizedBox(height: 8),
            ...rel.map((r) => Card(
                  child: ListTile(
                    title: Text(
                        'Art. ${r['articulo']} | ${r['titulo']}'),
                    subtitle: Text('${r['contenido'] ?? ''}',
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis),
                    trailing: const Text('›'),
                    onTap: () => setState(() {
                      _articulo = {
                        ...r,
                        '_codigo': art['_codigo'],
                        '_label': art['_label'],
                      };
                    }),
                  ),
                )),
          ],
        ],
      ),
    );
  }
}
