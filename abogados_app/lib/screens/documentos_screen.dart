import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../services/firestore_service.dart';
import '../services/pdf_service.dart';
import '../theme/app_theme.dart';
import '../utils/ayudas.dart' as ay;

const List<String> kTiposDocumento = [
  'Nota', 'Memorial', 'Demanda', 'Poder', 'Contrato', 'Otro',
];

const Map<String, String> kPlantillas = {
  'Nota': 'Bufete de Abogados\n\nFecha: \nPara: \nDe: \nAsunto: \n\nContenido de la nota...\n\nFirma: ____________________',
  'Memorial':
      'SEÑOR JUEZ\n\nQuien suscribe, abogado en ejercicio, con oficinas en Vía España, Edificio Arauz Barraza, Piso 8, Oficina 801, Ciudad de Panamá, ante usted comparece y expone:\n\nHECHOS:\n1. ...\n2. ...\n\nFUNDAMENTO DE DERECHO:\n...\n\nPETITORIO:\nSolicito respetuosamente...\n\nNOTIFICACIONES:\n...\n\nFirma: ____________________\nCédula: __________',
  'Demanda':
      'DEMANDA\n\nDEMANDANTE: \nDEMANDADO: \nCUANTÍA: B/. \n\nHECHOS:\nPRIMERO: ...\nSEGUNDO: ...\n\nPRETENSIÓN:\n...\n\nFUNDAMENTOS DE DERECHO:\n...\n\nPRUEBAS:\n1. Documental: ...\n2. Testimonial: ...\n\nPETITORIO:\n...\n\nFirma: ____________________',
  'Poder':
      'PODER ESPECIAL\n\nQuien suscribe, __________, con cédula __________, otorga poder especial al licenciado __________, con cédula __________, para que en mi nombre y representación actúe en: ...\n\nFACULTADES: demandar, contestar, apelar, transigir, recibir, sustituir y demás facultades necesarias conforme a la ley.\n\nOtorgado en la ciudad de Panamá, a los ___ días del mes de ___ de ___.\n\nOtorgante: ____________________\nApoderado: ____________________',
  'Contrato':
      'CONTRATO\n\nCOMPARECIENTES:\nPor una parte: __________, con cédula __________, en adelante EL CONTRATANTE.\nPor la otra parte: __________, con cédula __________, en adelante EL CONTRATISTA.\n\nCLÁUSULAS:\nPRIMERA (Objeto): ...\nSEGUNDA (Precio): B/. ...\nTERCERA (Plazo): ...\nCUARTA (Resolución): ...\n\nFirmado en dos ejemplares en la ciudad de Panamá.\n\nEL CONTRATANTE: ____________________\nEL CONTRATISTA: ____________________',
  'Otro': 'Título del documento\n\nEscriba aquí su nota o escrito...',
};

/// Editor de documentos estilo Word: plantillas, guardado, impresión y PDF.
class DocumentosScreen extends StatefulWidget {
  final ThemeController themeController;
  const DocumentosScreen({super.key, required this.themeController});

  @override
  State<DocumentosScreen> createState() => _DocumentosScreenState();
}

class _DocumentosScreenState extends State<DocumentosScreen> {
  final _busquedaCtrl = TextEditingController();
  String _busqueda = '';

  @override
  void dispose() {
    _busquedaCtrl.dispose();
    super.dispose();
  }

  User get _user => FirebaseAuth.instance.currentUser!;

  List<QueryDocumentSnapshot<Map<String, dynamic>>> _filtrar(
      List<QueryDocumentSnapshot<Map<String, dynamic>>> docs) {
    if (_busqueda.isEmpty) return docs;
    final q = _busqueda.toLowerCase();
    return docs.where((d) {
      final data = d.data();
      return '${data['titulo'] ?? ''} ${data['tipo'] ?? ''}'
          .toLowerCase()
          .contains(q);
    }).toList();
  }

  Future<void> _confirmarEliminar(String id) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Eliminar Documento'),
        content: const Text('¿Está seguro? Esta acción no se puede deshacer.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Eliminar'),
          ),
        ],
      ),
    );
    if (ok == true) {
      final r = await FirestoreService.eliminar('documentos', id);
      if (!mounted) return;
      if (!r.ok) ay.alerta(context, 'Error', r.error ?? 'No se pudo eliminar');
    }
  }

  Future<void> _abrirEditor(
      {String? id, Map<String, dynamic>? datos}) async {
    final c = widget.themeController.colors;
    final titulo = TextEditingController(text: '${datos?['titulo'] ?? ''}');
    final contenido =
        TextEditingController(text: '${datos?['contenido'] ?? ''}');
    String tipo = '${datos?['tipo'] ?? 'Nota'}';
    bool guardando = false;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModal) => Container(
          height: MediaQuery.of(ctx).size.height * 0.92,
          decoration: BoxDecoration(
            color: c.surface,
            borderRadius:
                const BorderRadius.vertical(top: Radius.circular(30)),
          ),
          padding: EdgeInsets.only(
            left: 20, right: 20, top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(id == null ? 'Nuevo Documento' : 'Editar Documento',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: c.primary)),
              const SizedBox(height: 12),
              TextField(
                controller: titulo,
                decoration:
                    const InputDecoration(hintText: 'Título del documento *'),
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                children: kTiposDocumento
                    .map((t) => ChoiceChip(
                          label: Text(t),
                          selected: tipo == t,
                          selectedColor: c.primary,
                          labelStyle: TextStyle(
                              color:
                                  tipo == t ? Colors.white : c.text),
                          onSelected: (_) => setModal(() {
                            tipo = t;
                            if (contenido.text.trim().isEmpty ||
                                id == null) {
                              contenido.text = kPlantillas[t] ?? '';
                            }
                          }),
                        ))
                    .toList(),
              ),
              const SizedBox(height: 10),
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: c.border),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.all(12),
                  child: TextField(
                    controller: contenido,
                    maxLines: null,
                    expands: true,
                    textAlignVertical: TextAlignVertical.top,
                    decoration: const InputDecoration(
                      hintText: 'Escriba aquí su nota o escrito...',
                      border: InputBorder.none,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(ctx),
                      child: const Text('Cerrar'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: guardando
                          ? null
                          : () async {
                              if (titulo.text.trim().isEmpty) {
                                ay.alerta(context, 'Error',
                                    'El título es obligatorio');
                                return;
                              }
                              setModal(() => guardando = true);
                              final datosGuardar = {
                                'titulo': titulo.text.trim(),
                                'tipo': tipo,
                                'contenido': contenido.text,
                              };
                              final r = id == null
                                  ? await FirestoreService.crear(
                                      'documentos', {
                                      ...datosGuardar,
                                      'abogadoId': _user.uid,
                                    })
                                  : await FirestoreService.actualizar(
                                          'documentos', id, datosGuardar)
                                      .then((v) => (
                                            ok: v.ok,
                                            id: id,
                                            error: v.error
                                          ));
                              if (!ctx.mounted || !mounted) return;
                              if (!r.ok) {
                                ay.alerta(context, 'Error',
                                    r.error ?? 'No se pudo guardar');
                              } else {
                                Navigator.pop(ctx);
                              }
                              setModal(() => guardando = false);
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: c.primary,
                        foregroundColor: c.textLight,
                      ),
                      child: Text(
                          guardando ? 'Guardando...' : 'Guardar'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => PdfService.documento(
                        context,
                        titulo: titulo.text.trim().isEmpty
                            ? 'Documento'
                            : titulo.text.trim(),
                        tipo: tipo,
                        contenido: contenido.text,
                        imprimir: true,
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: c.secondary,
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('🖨️ Imprimir'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => PdfService.documento(
                        context,
                        titulo: titulo.text.trim().isEmpty
                            ? 'Documento'
                            : titulo.text.trim(),
                        tipo: tipo,
                        contenido: contenido.text,
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: c.success,
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('📄 PDF'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.themeController.colors;

    return Scaffold(
      backgroundColor: c.background,
      appBar: AppBar(
        backgroundColor: c.headerBg,
        foregroundColor: Colors.white,
        leading: const BackButton(),
        title: const Text('📝 Documentos y Escritos'),
        actions: [
          IconButton(
            icon: const Text('+', style: TextStyle(fontSize: 26)),
            onPressed: () => _abrirEditor(),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _busquedaCtrl,
              onChanged: (v) =>
                  setState(() => _busqueda = v.trim()),
              decoration: const InputDecoration(
                prefixText: '🔍 ',
                hintText: 'Buscar documento...',
              ),
            ),
          ),
          Expanded(
            child: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
              stream:
                  FirestoreService.escuchar('documentos', _user.uid),
              builder: (_, snap) {
                if (snap.hasError) {
                  return Center(
                      child: Text('Error: ${snap.error}'));
                }
                if (!snap.hasData) {
                  return const Center(
                      child: CircularProgressIndicator());
                }
                final docs = _filtrar(snap.data!.docs);
                if (docs.isEmpty) {
                  return const Center(
                      child: Text(
                          'Sin documentos. Presione + para crear su primer escrito.'));
                }
                return ListView.builder(
                  itemCount: docs.length,
                  itemBuilder: (_, i) {
                    final d = docs[i];
                    final data = d.data();
                    return Card(
                      margin: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      child: InkWell(
                        onTap: () => _abrirEditor(
                            id: d.id, datos: data),
                        onLongPress: () =>
                            _confirmarEliminar(d.id),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Row(
                            children: [
                              const Text('📝',
                                  style:
                                      TextStyle(fontSize: 28)),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                        '${data['titulo'] ?? ''}',
                                        style: const TextStyle(
                                            fontWeight:
                                                FontWeight.bold,
                                            fontSize: 16)),
                                    Text('${data['tipo'] ?? ''}',
                                        style: TextStyle(
                                            color:
                                                c.textSecondary)),
                                  ],
                                ),
                              ),
                              IconButton(
                                icon: const Text('🖨️',
                                    style:
                                        TextStyle(fontSize: 22)),
                                tooltip: 'Imprimir',
                                onPressed: () =>
                                    PdfService.documento(
                                  context,
                                  titulo:
                                      '${data['titulo'] ?? 'Documento'}',
                                  tipo: '${data['tipo'] ?? ''}',
                                  contenido:
                                      '${data['contenido'] ?? ''}',
                                  imprimir: true,
                                ),
                              ),
                              IconButton(
                                icon: const Text('📄',
                                    style:
                                        TextStyle(fontSize: 22)),
                                tooltip: 'PDF',
                                onPressed: () =>
                                    PdfService.documento(
                                  context,
                                  titulo:
                                      '${data['titulo'] ?? 'Documento'}',
                                  tipo: '${data['tipo'] ?? ''}',
                                  contenido:
                                      '${data['contenido'] ?? ''}',
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
