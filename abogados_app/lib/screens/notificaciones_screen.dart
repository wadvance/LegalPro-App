import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../services/firestore_service.dart';
import '../theme/app_theme.dart';
import '../utils/ayudas.dart' as ay;

const Map<String, String> kIconosNotif = {
  'movimiento': '⚖️',
  'edicto': '📜',
  'cobro': '💰',
  'cita': '📅',
};

/// Centro de notificaciones: movimientos, edictos y avisos del sistema.
class NotificacionesScreen extends StatefulWidget {
  final ThemeController themeController;
  const NotificacionesScreen(
      {super.key, required this.themeController});

  @override
  State<NotificacionesScreen> createState() =>
      _NotificacionesScreenState();
}

class _NotificacionesScreenState
    extends State<NotificacionesScreen> {
  User get _user => FirebaseAuth.instance.currentUser!;

  Future<void> _marcarTodas() async {
    final snap = await FirebaseFirestore.instance
        .collection('notificaciones')
        .where('abogadoId', isEqualTo: _user.uid)
        .where('leida', isEqualTo: false)
        .get();
    for (final d in snap.docs) {
      await d.reference.update({'leida': true});
    }
  }

  Future<void> _registrarEdicto() async {
    final c = widget.themeController.colors;
    final numero = TextEditingController();
    final juzgado = TextEditingController();
    final detalle = TextEditingController();
    bool guardando = false;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModal) => Container(
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
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Registrar Edicto',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: c.primary)),
              const SizedBox(height: 4),
              Text(
                  'Anota el edicto visto en el portal del Órgano Judicial para avisar a tu equipo.',
                  style: TextStyle(
                      fontSize: 12, color: c.textSecondary)),
              const SizedBox(height: 12),
              TextField(
                  controller: numero,
                  decoration: const InputDecoration(
                      hintText: 'No. de expediente *')),
              const SizedBox(height: 10),
              TextField(
                  controller: juzgado,
                  decoration: const InputDecoration(
                      hintText: 'Juzgado / dependencia')),
              const SizedBox(height: 10),
              TextField(
                  controller: detalle,
                  maxLines: 3,
                  decoration: const InputDecoration(
                      hintText: 'Detalle del edicto')),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(ctx),
                      child: const Text('Cancelar'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: guardando
                          ? null
                          : () async {
                              if (numero.text.trim().isEmpty) {
                                ay.alerta(context, 'Error',
                                    'El número de expediente es obligatorio');
                                return;
                              }
                              setModal(() => guardando = true);
                              await FirestoreService.notificar(
                                uid: _user.uid,
                                tipo: 'edicto',
                                titulo:
                                    'Edicto en Exp. #${numero.text.trim()}',
                                mensaje:
                                    '${juzgado.text.trim().isEmpty ? 'Órgano Judicial' : juzgado.text.trim()}: ${detalle.text.trim().isEmpty ? 'Ver edicto publicado' : detalle.text.trim()}',
                                numero: numero.text.trim(),
                              );
                              if (!ctx.mounted || !mounted) {
                                return;
                              }
                              Navigator.pop(ctx);
                              setModal(() => guardando = false);
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: c.primary,
                        foregroundColor: c.textLight,
                      ),
                      child: Text(guardando
                          ? 'Guardando...'
                          : 'Registrar'),
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

  Future<void> _abrirEdictos() async {
    await launchUrl(
        Uri.parse(
            'https://www.organojudicial.gob.pa/consultas-y-aplicaciones'),
        mode: LaunchMode.externalApplication);
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
        title: const Text('🔔 Notificaciones'),
        actions: [
          IconButton(
            icon: const Text('📜', style: TextStyle(fontSize: 22)),
            tooltip: 'Ver edictos en el Órgano Judicial',
            onPressed: _abrirEdictos,
          ),
          IconButton(
            icon: const Text('+', style: TextStyle(fontSize: 26)),
            tooltip: 'Registrar edicto',
            onPressed: _registrarEdicto,
          ),
        ],
      ),
      body: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
        stream: FirestoreService.notificaciones(_user.uid),
        builder: (_, snap) {
          if (snap.hasError) {
            return Center(child: Text('Error: ${snap.error}'));
          }
          if (!snap.hasData) {
            return const Center(
                child: CircularProgressIndicator());
          }
          final docs = snap.data!.docs.toList()
            ..sort((a, b) {
              final fa = ay.fechaDe(a.data()['createdAt']);
              final fb = ay.fechaDe(b.data()['createdAt']);
              if (fa == null || fb == null) return 0;
              return fb.compareTo(fa);
            });
          final noLeidas =
              docs.where((d) => d.data()['leida'] != true).length;
          if (docs.isEmpty) {
            return const Center(
                child: Text(
                    'Sin notificaciones.\nLos movimientos y edictos aparecerán aquí.'));
          }
          return Column(
            children: [
              if (noLeidas > 0)
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      Expanded(
                          child: Text('$noLeidas sin leer',
                              style: TextStyle(
                                  color: c.textSecondary))),
                      TextButton(
                        onPressed: _marcarTodas,
                        child: const Text('Marcar todas como leídas'),
                      ),
                    ],
                  ),
                ),
              Expanded(
                child: ListView.builder(
                  itemCount: docs.length,
                  itemBuilder: (_, i) {
                    final d = docs[i];
                    final data = d.data();
                    final leida = data['leida'] == true;
                    final tipo = '${data['tipo'] ?? 'movimiento'}';
                    final f = ay.fechaDe(data['createdAt']);
                    return Card(
                      margin: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      color: leida ? c.surface : null,
                      child: ListTile(
                        leading: Text(
                            kIconosNotif[tipo] ?? '🔔',
                            style:
                                const TextStyle(fontSize: 28)),
                        title: Text('${data['titulo'] ?? ''}',
                            style: TextStyle(
                                fontWeight: leida
                                    ? FontWeight.normal
                                    : FontWeight.bold)),
                        subtitle: Column(
                          crossAxisAlignment:
                              CrossAxisAlignment.start,
                          children: [
                            Text('${data['mensaje'] ?? ''}'),
                            if (f != null)
                              Text('${f.day}/${f.month}/${f.year}',
                                  style: TextStyle(
                                      fontSize: 11,
                                      color: c.textSecondary)),
                          ],
                        ),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (!leida)
                              Container(
                                width: 10,
                                height: 10,
                                decoration: BoxDecoration(
                                  color: c.primary,
                                  shape: BoxShape.circle,
                                ),
                              ),
                            IconButton(
                              icon: const Text('🗑️'),
                              onPressed: () =>
                                  FirestoreService.eliminar(
                                      'notificaciones', d.id),
                            ),
                          ],
                        ),
                        onTap: () {
                          if (!leida) {
                            d.reference
                                .update({'leida': true});
                          }
                        },
                      ),
                    );
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
