import 'package:cloud_firestore/cloud_firestore.dart';

/// Equivale a src/services/firestoreService.js (clientes + dashboard).
class FirestoreService {
  static final FirebaseFirestore _db = FirebaseFirestore.instance;

  // ---------- Genéricos ----------

  static Future<({bool ok, String? id, String? error})> crear(
      String coleccion, Map<String, dynamic> datos) async {
    try {
      final ref = await _db.collection(coleccion).add({
        ...datos,
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });
      return (ok: true, id: ref.id, error: null);
    } catch (e) {
      return (ok: false, id: null, error: '$e');
    }
  }

  static Future<({bool ok, String? error})> actualizar(
      String coleccion, String id, Map<String, dynamic> datos) async {
    try {
      await _db.collection(coleccion).doc(id).update({
        ...datos,
        'updatedAt': FieldValue.serverTimestamp(),
      });
      return (ok: true, error: null);
    } catch (e) {
      return (ok: false, error: '$e');
    }
  }

  static Future<({bool ok, String? error})> eliminar(
      String coleccion, String id) async {
    try {
      await _db.collection(coleccion).doc(id).delete();
      return (ok: true, error: null);
    } catch (e) {
      return (ok: false, error: '$e');
    }
  }

  static Stream<QuerySnapshot<Map<String, dynamic>>> escuchar(
      String coleccion, String uid) {
    return _db
        .collection(coleccion)
        .where('abogadoId', isEqualTo: uid)
        .snapshots();
  }

  // ---------- Clientes ----------

  static Map<String, dynamic> nuevoCliente({
    required String uid,
    required String abogadoNombre,
    required String nombre,
    required String apellido,
    String cedula = '',
    String telefono = '',
    String email = '',
    String direccion = '',
    String ruc = '',
    String notas = '',
  }) {
    return {
      'nombre': nombre.trim(),
      'apellido': apellido.trim(),
      'cedula': cedula.trim(),
      'telefono': telefono.trim(),
      'email': email.trim(),
      'direccion': direccion.trim(),
      'ruc': ruc.trim(),
      'tipo': 'Persona Natural',
      'notas': notas.trim(),
      'abogadoId': uid,
      'abogadoNombre': abogadoNombre,
    };
  }

  // ---------- Dashboard ----------

  static Future<({
    int totalClientes,
    int totalExpedientes,
    int citasPendientes,
    double cobrosDelMes
  })> dashboard(String uid) async {
    // Consultas con un solo filtro (sin índices compuestos) y
    // agregación en cliente para máxima compatibilidad.
    final clientes = await _db
        .collection('clientes')
        .where('abogadoId', isEqualTo: uid)
        .count()
        .get();
    final expedientes = await _db
        .collection('expedientes')
        .where('abogadoId', isEqualTo: uid)
        .count()
        .get();
    final citas = await _db
        .collection('citas')
        .where('abogadoId', isEqualTo: uid)
        .get();
    var pendientes = 0;
    for (final d in citas.docs) {
      if ('${d.data()['estado'] ?? ''}' == 'pendiente') pendientes++;
    }

    final ahora = DateTime.now();
    final cobros = await _db
        .collection('cobros')
        .where('abogadoId', isEqualTo: uid)
        .get();
    double total = 0;
    for (final d in cobros.docs) {
      final data = d.data();
      final creado = (data['createdAt'] as Timestamp?)?.toDate();
      if (creado != null &&
          creado.year == ahora.year &&
          creado.month == ahora.month) {
        final m = data['monto'];
        if (m is num) {
          total += m.toDouble();
        } else if (m is String) {
          total += double.tryParse(m) ?? 0;
        }
      }
    }
    return (
      totalClientes: clientes.count ?? 0,
      totalExpedientes: expedientes.count ?? 0,
      citasPendientes: pendientes,
      cobrosDelMes: total,
    );
  }

  static Stream<QuerySnapshot<Map<String, dynamic>>> proximasCitas(
      String uid) {
    // Sin índices compuestos: se filtra y ordena en el cliente.
    return _db
        .collection('citas')
        .where('abogadoId', isEqualTo: uid)
        .snapshots();
  }
}
