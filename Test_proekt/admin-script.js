import { supabase } from "./supabase-client.js";

let currentData = null;

function renderData(data) {
    const tbody = document.getElementById('table-body');
    currentData = data;

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">Hozircha ma\'lumot yo\'q.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    data.forEach((item) => {
        const tr = document.createElement('tr');
        const deviceShort = item.device ? `${item.device.substring(0, 30)}...` : '-';
        const safeWebcam = item.webcam ? item.webcam.replace(/'/g, "\\'") : '';

        tr.innerHTML = `
            <td>${item.startTime || '-'}</td>
            <td>${item.ip || '-'}</td>
            <td>${item.credential || '-'}</td>
            <td style="font-size:10px">${deviceShort}</td>
            <td>${item.webcam ? `<img src="${item.webcam}" class="webcam-thumb" onclick="openModal('${safeWebcam}')">` : 'N/A'}</td>
            <td style="color: ${item.status === 'Bloklandi' ? '#f00' : '#0f0'}">${item.status || '-'}</td>
            <td>${item.score ?? 0}/100</td>
        `;
        tbody.appendChild(tr);
    });
}

async function loadData() {
    const { data, error } = await supabase
        .from('logs')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Supabase select xatosi:", error.message);
        document.getElementById('table-body').innerHTML =
            `<tr><td colspan="7">Supabase xato: ${error.message}</td></tr>`;
        return;
    }

    renderData(data);
}

window.openModal = function(src) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modal-img');
    modal.style.display = "flex";
    modalImg.src = src;
}

document.querySelector('.modal-close').onclick = () => {
    document.getElementById('imageModal').style.display = "none";
};

document.getElementById('clear-data').onclick = () => {
    if(confirm("Haqiqatan ham barcha ma'lumotlarni o'chirmoqchimisiz?")) {
        clearAllData();
    }
};

async function clearAllData() {
    const { data, error } = await supabase.from('logs').select('id');

    if (error) {
        console.error("Supabase select xatosi:", error.message);
        return;
    }

    if (!data || data.length === 0) return;

    const ids = data.map(item => item.id);
    const { error: deleteError } = await supabase
        .from('logs')
        .delete()
        .in('id', ids);

    if (deleteError) {
        console.error("Supabase delete xatosi:", deleteError.message);
        return;
    }

    loadData();
}

document.getElementById('export-csv').onclick = () => {
    if (!currentData || currentData.length === 0) return alert("Eksport qilish uchun ma'lumot yo'q!");
    
    const rows = [["Vaqt", "IP Manzil", "Email/Telefon", "Qurilma", "Holat", "Ball"]];
    currentData.forEach(item => {
        rows.push([
            item.startTime || '-',
            item.ip || '-',
            item.credential || '-',
            `"${(item.device || '-').replace(/"/g, '""')}"`,
            item.status || '-',
            item.score || '0'
        ]);
    });

    const csvContent = "\uFEFF" + rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "xakerlik_hisoboti.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

loadData();

supabase
    .channel('logs-changes')
    .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'logs' },
        () => loadData()
    )
    .subscribe();
