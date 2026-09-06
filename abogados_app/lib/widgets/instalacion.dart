import 'package:flutter/material.dart';

import '../services/instalacion_service.dart';
import '../theme/app_theme.dart';

const List<(String, String)> kPasosAndroid = [
  ('🌐', 'Abre Google Chrome'),
  ('⋮', 'Toca el menú de 3 puntos'),
  ('🏠', 'Selecciona "Agregar a pantalla de inicio"'),
  ('✅', 'Confirma la instalación'),
];

const List<(String, String)> kPasosIos = [
  ('🌐', 'Abre Safari'),
  ('📤', 'Toca el botón Compartir'),
  ('🏠', 'Desplázate y toca "Agregar a pantalla de inicio"'),
  ('✅', 'Confirma con "Agregar"'),
];

/// Equivale a InstallContext (banner a los 3s + modal con pasos).
class InstallController extends ChangeNotifier {
  bool banner = false;
  bool modal = false;

  InstallController() {
    if (InstalacionService.puedeInstalar()) {
      Future.delayed(const Duration(seconds: 3), () {
        banner = true;
        notifyListeners();
      });
    }
  }

  Future<void> instalar() async {
    banner = false;
    notifyListeners();
    final ok = await InstalacionService.intentarInstalacion();
    if (!ok) {
      modal = true;
      notifyListeners();
    }
  }

  void cerrarBanner() {
    banner = false;
    notifyListeners();
  }

  void abrirModal() {
    banner = false;
    modal = true;
    notifyListeners();
  }

  void cerrarModal() {
    modal = false;
    notifyListeners();
  }
}

/// Banner inferior (equivale a InstallBanner).
class InstallBanner extends StatelessWidget {
  final InstallController controller;
  final AppColors c;
  const InstallBanner(
      {super.key, required this.controller, required this.c});

  @override
  Widget build(BuildContext context) {
    return Positioned(
      left: 0,
      right: 0,
      bottom: 0,
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 28),
        decoration: BoxDecoration(
          color: c.primary,
          boxShadow: const [
            BoxShadow(
                color: Colors.black26,
                blurRadius: 8,
                offset: Offset(0, -4)),
          ],
        ),
        child: Row(
          children: [
            const Text('📥', style: TextStyle(fontSize: 28)),
            const SizedBox(width: 10),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Instala nuestra app',
                      style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white)),
                  Text('Accede rápido desde tu pantalla de inicio',
                      style: TextStyle(
                          fontSize: 12,
                          color: Color.fromRGBO(
                              255, 255, 255, 0.8))),
                ],
              ),
            ),
            ElevatedButton(
              onPressed: controller.instalar,
              style: ElevatedButton.styleFrom(
                backgroundColor: c.secondary,
                foregroundColor: Colors.white,
                minimumSize: const Size(0, 40),
                padding:
                    const EdgeInsets.symmetric(horizontal: 20),
              ),
              child: const Text('Instalar'),
            ),
            IconButton(
              onPressed: controller.cerrarBanner,
              icon: const Text('✕',
                  style: TextStyle(
                      color: Color.fromRGBO(255, 255, 255, 0.8),
                      fontSize: 18,
                      fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }
}

/// Modal con pasos Android/iOS (equivale a InstallModal).
class InstallModal extends StatefulWidget {
  final InstallController controller;
  final AppColors c;
  const InstallModal(
      {super.key, required this.controller, required this.c});

  @override
  State<InstallModal> createState() => _InstallModalState();
}

class _InstallModalState extends State<InstallModal> {
  late String _tab;

  @override
  void initState() {
    super.initState();
    final nav = InstalacionService.navegador();
    _tab = nav == 'ios' ? 'ios' : 'android';
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.c;
    final pasos = _tab == 'android' ? kPasosAndroid : kPasosIos;

    return Positioned.fill(
      child: Container(
        color: const Color.fromRGBO(0, 0, 0, 0.5),
        alignment: Alignment.center,
        padding: const EdgeInsets.all(24),
        child: Container(
          constraints: const BoxConstraints(maxWidth: 400),
          decoration: BoxDecoration(
            color: c.surface,
            borderRadius: BorderRadius.circular(20),
          ),
          padding: const EdgeInsets.all(24),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment:
                  CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment:
                      MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Instalar App',
                        style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: c.text)),
                    IconButton(
                      onPressed: widget.controller.cerrarModal,
                      icon: Text('✕',
                          style: TextStyle(
                              color: c.textSecondary,
                              fontSize: 20,
                              fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
                Text(
                    'Sigue estos pasos para instalar la app en tu dispositivo:',
                    style: TextStyle(color: c.textSecondary)),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                        child: _tabBtn('🤖', 'Android',
                            'android', c)),
                    const SizedBox(width: 12),
                    Expanded(
                        child: _tabBtn(
                            '🍎', 'iOS', 'ios', c)),
                  ],
                ),
                const SizedBox(height: 16),
                ...pasos.asMap().entries.map((en) => Padding(
                      padding:
                          const EdgeInsets.only(bottom: 16),
                      child: Row(
                        children: [
                          Container(
                            width: 28,
                            height: 28,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: c.primary,
                              borderRadius:
                                  BorderRadius.circular(14),
                            ),
                            child: Text('${en.key + 1}',
                                style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight:
                                        FontWeight.bold)),
                          ),
                          const SizedBox(width: 12),
                          Text(en.value.$1,
                              style:
                                  const TextStyle(fontSize: 22)),
                          const SizedBox(width: 8),
                          Expanded(
                              child: Text(en.value.$2,
                                  style: TextStyle(
                                      color: c.text))),
                        ],
                      ),
                    )),
                if (InstalacionService.tienePrompt())
                  Padding(
                    padding:
                        const EdgeInsets.only(bottom: 10),
                    child: ElevatedButton(
                      onPressed: () async {
                        final ok =
                            await InstalacionService
                                .intentarInstalacion();
                        if (ok) {
                          widget.controller.cerrarModal();
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: c.primary,
                        foregroundColor: Colors.white,
                        minimumSize:
                            const Size.fromHeight(48),
                      ),
                      child: const Text(
                          'Intentar instalación automática'),
                    ),
                  ),
                OutlinedButton(
                  onPressed: widget.controller.cerrarModal,
                  style: OutlinedButton.styleFrom(
                      minimumSize:
                          const Size.fromHeight(44)),
                  child: Text('Entendido',
                      style:
                          TextStyle(color: c.textSecondary)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _tabBtn(
      String icono, String titulo, String valor, AppColors c) {
    final sel = _tab == valor;
    return OutlinedButton(
      onPressed: () => setState(() => _tab = valor),
      style: OutlinedButton.styleFrom(
        backgroundColor: sel ? c.primary : null,
        side: BorderSide(
            color: sel ? c.primary : c.border, width: 1.5),
        foregroundColor: sel ? Colors.white : c.textSecondary,
        minimumSize: const Size.fromHeight(44),
      ),
      child: Text('$icono $titulo'),
    );
  }
}
