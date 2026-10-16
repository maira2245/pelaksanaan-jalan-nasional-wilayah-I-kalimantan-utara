<?php
include 'koneksi.php';

header('Content-Type: application/json');
date_default_timezone_set('Asia/Makassar');

$tgl_mulai   = isset($_GET['tgl_mulai']) && !empty($_GET['tgl_mulai']) ? $_GET['tgl_mulai'] : date('Y-m-01');
$tgl_selesai = isset($_GET['tgl_selesai']) && !empty($_GET['tgl_selesai']) ? $_GET['tgl_selesai'] : date('Y-m-d');
$pegawai_id  = isset($_GET['pegawai_id']) ? $_GET['pegawai_id'] : '';

$where_pegawai = !empty($pegawai_id) ? "AND a.pegawai_id = '$pegawai_id'" : "";

$q = "SELECT a.*, p.nama, p.jabatan FROM absensi a 
      JOIN pegawai p ON a.pegawai_id = p.id 
      WHERE a.tanggal BETWEEN '$tgl_mulai' AND '$tgl_selesai' $where_pegawai
      ORDER BY a.tanggal ASC, p.nama ASC";

$res = mysqli_query($conn, $q);
$data = array();

if ($res && mysqli_num_rows($res) > 0) {
    while ($r = mysqli_fetch_assoc($res)) {
        $r['tanggal_formatted'] = date('d/m/Y', strtotime($r['tanggal']));
        $data[] = $r;
    }
}

echo json_encode($data);
?>