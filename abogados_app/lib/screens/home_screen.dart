import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../services/auth_service.dart';
import '../services/firestore_service.dart';
import '../theme/app_theme.dart';

/// Replica src/screens/HomeScreen.js (header, métricas, citas, accesos).
class HomeScreen extends StatefulWidget {
  final ThemeController themeController;
  final void Function(int) irATab;
  const HomeScreen(
      {super.key, required this.themeController, required this.irATab});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Map<String, dynamic>? _perfil;
  ({int totalClientes, int totalExpedientes, int citasPendientes, double cobrosDelMes})?
      _stats;
  bool _cargando = true;

  User get _user => FirebaseAuth.instance.currentUser!;

  @override
  void initState() {
    super.initState();
    _cargar();
  }

  Future<void> _cargar() async {
    setState(() => _cargando = true);
    try {
      final perfil = await AuthService.perfil(_user.uid);
      final stats = await FirestoreService.dashboard(_user.uid);
      if (!mounted) return;
      setState(() {
        _perfil = perfil;
        _stats = stats;
      });
    } finally {
      if (mounted) setState(() => _cargando = false);
    }
  }

  String _moneda(double v) => 'B/. ${v.toStringAsFixed(2)}';

  String _fechaCorta(dynamic fecha) {
    DateTime? d;
    if (fecha is Timestamp) {
      d = fecha.toDate();
    } else if (fecha is String) {
      d = DateTime.tryParse(fecha);
    }
    if (d == null) return '';
    const meses = [
      'ene', 'feb', 'mar', 'abr', 'may', 'jun',
      'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
    ];
    return '${d.day} ${meses[d.month - 1]}';
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.themeController.colors;
    final nombre = (_perfil?['nombre'] as String?) ?? 'Usuario';
    final inicial =
        nombre.isNotEmpty ? nombre[0].toUpperCase() : '👤';

    return Scaffold(
      backgroundColor: c.background,
      body: _cargando
          ? const Center(child: Text('Cargando aplicación...'))
          : RefreshIndicator(
              onRefresh: _cargar,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _header(c, nombre, inicial),
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          _metricas(c),
                          const SizedBox(height: 16),
                          _proximasCitas(c),
                          const SizedBox(height: 16),
                          _accesoRapido(c),
                          const SizedBox(height: 16),
                          Center(
                            child: Column(
                              children: [
                                Text('Bufete de Abogados',
                                    style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        color: c.text)),
                                Text(
                                    'Justicia cercana, soluciones reales',
                                    style: TextStyle(
                                        fontStyle: FontStyle.italic,
                                        fontSize: 12,
                                        color: c.textSecondary)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _header(AppColors c, String nombre, String inicial) {
    return Container(
      padding: EdgeInsets.only(
          top: MediaQuery.of(context).padding.top + 16,
          left: 16,
          right: 16,
          bottom: 20),
      decoration: BoxDecoration(
        color: c.headerBg,
        borderRadius:
            const BorderRadius.vertical(bottom: Radius.circular(28)),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: Colors.white24,
            child: Text(inicial,
                style:
                    const TextStyle(color: Colors.white, fontSize: 20)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('BIENVENIDO,',
                    style: TextStyle(
                        fontSize: 10,
                        color: Color.fromRGBO(255, 255, 255, 0.7))),
                Text(nombre,
                    style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.white)),
                const Text('Justicia cercana, soluciones reales',
                    style: TextStyle(
                        fontStyle: FontStyle.italic,
                        fontSize: 10,
                        color: Color(0xFFC5A028))),
              ],
            ),
          ),
          IconButton(
            onPressed: () => widget.themeController.toggle(),
            icon: Text(
                widget.themeController.isDark ? '☀️' : '🌙',
                style: const TextStyle(fontSize: 20)),
          ),
          ElevatedButton(
            onPressed: () => AuthService.logout(),
            style: ElevatedButton.styleFrom(
              backgroundColor: c.accent,
              foregroundColor: Colors.white,
              minimumSize: const Size(0, 36),
              padding: const EdgeInsets.symmetric(horizontal: 12),
            ),
            child: const Text('Salir'),
          ),
        ],
      ),
    );
  }

  Widget _metricas(AppColors c) {
    final s = _stats;
    final datos = [
      ('👥', 'Clientes Registrados', '${s?.totalClientes ?? 0}',
          const Color(0xFF1976D2)),
      ('📁', 'Expedientes Activos', '${s?.totalExpedientes ?? 0}',
          const Color(0xFF388E3C)),
      ('📅', 'Citas Pendientes', '${s?.citasPendientes ?? 0}',
          const Color(0xFFF57C00)),
      ('💰', 'Cobros del Mes', _moneda(s?.cobrosDelMes ?? 0),
          const Color(0xFFD32F2F)),
    ];
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 1.6),
      itemCount: datos.length,
      itemBuilder: (_, i) {
        final (icono, titulo, valor, color) = datos[i];
        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: c.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border(left: BorderSide(color: color, width: 4)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('$icono $titulo',
                  style: TextStyle(
                      fontSize: 12, color: c.textSecondary)),
              const SizedBox(height: 4),
              Text(valor,
                  style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: c.text)),
            ],
          ),
        );
      },
    );
  }

  Widget _proximasCitas(AppColors c) {
    return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
      stream: FirestoreService.proximasCitas(_user.uid),
      builder: (_, snap) {
        if (!snap.hasData || snap.data!.docs.isEmpty) {
          return const SizedBox.shrink();
        }
        final citas = snap.data!.docs;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('📅 Próximas Citas',
                    style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: c.text)),
                TextButton(
                  onPressed: () => widget.irATab(3),
                  child: const Text('Ver todas'),
                ),
              ],
            ),
            ...citas.map((d) {
              final data = d.data();
              final titulo =
                  '${data['titulo'] ?? data['clienteNombre'] ?? 'Cita'}';
              return Card(
                child: ListTile(
                  leading: Container(
                    width: 52,
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    decoration: BoxDecoration(
                      color: c.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(_fechaCorta(data['fecha']),
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: c.primary)),
                  ),
                  title: Text(titulo),
                  subtitle: Text(
                      'Cliente: ${data['clienteNombre'] ?? ''} • ${data['hora'] ?? ''}'),
                  trailing: const Text('›',
                      style: TextStyle(fontSize: 22)),
                  onTap: () => widget.irATab(3),
                ),
              );
            }),
          ],
        );
      },
    );
  }

  Widget _accesoRapido(AppColors c) {
    final isDark = widget.themeController.isDark;
    final accesos = [
      ('👥', 'Clientes', const Color(0xFF1976D2), 1),
      ('📁', 'Expedientes', const Color(0xFF388E3C), 2),
      ('📅', 'Citas', const Color(0xFFF57C00), 3),
      ('💰', 'Cobros', const Color(0xFFD32F2F), 4),
      ('📍', 'GPS', const Color(0xFFE91E63), 5),
      ('🧮', 'Calculadoras', const Color(0xFF7B1FA2), -1),
      ('⚖️', 'Leyes', const Color(0xFF1A237E), -1),
      ('💬', 'Chatbot', const Color(0xFF00897B), -1),
      ('📊', 'Reportes', const Color(0xFF5D4037), -1),
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('⚡ Acceso Rápido',
            style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: c.text)),
        const SizedBox(height: 8),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate:
              const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 1.1),
          itemCount: accesos.length,
          itemBuilder: (_, i) {
            final (icono, titulo, color, tab) = accesos[i];
            return InkWell(
              onTap: () {
                if (tab >= 0) {
                  widget.irATab(tab);
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                        content: Text(
                            '$titulo disponible en la fase 2')),
                  );
                }
              },
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 52,
                    height: 52,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: color.withValues(
                          alpha: isDark ? 0.25 : 0.12),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(icono,
                        style: const TextStyle(fontSize: 26)),
                  ),
                  const SizedBox(height: 4),
                  Text(titulo,
                      style:
                          TextStyle(fontSize: 12, color: c.text)),
                ],
              ),
            );
          },
        ),
      ],
    );
  }
}
