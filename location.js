// 各オプションの場所の座標
var loc_coordinat = {
    "option1": "141.3538497,43.0611086",
    "option2": "141.353556,43.062558",
    "option3": "141.35113642643597,43.0686946023698",
    "option4": "141.3576215,43.06454",
    "option5": "141.35451081847282,43.04515309937545",
    "option6": " 141.33038906779382,43.060588292260945"
}

// 地図オブジェクト(キーと値のまとまり)を初期化
const map = new maplibregl.Map({
    //地図が表示される HTML 要素の ID を指定しています
    container: 'map',
    // OpenStreetMap のスタイルを使用して地図を表示しています
    style: {
        // Mapbox スタイルのバージョン
        "version": 8,
        // 地図のデータソースを定義しています。ここでは OpenStreetMap を使用しています
        "sources": {
            "osm": {
                // ソースの種類を指定
                "type": "raster",
                // タイルの URL パターンを指定しています
                "tiles": ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
                // タイルのサイズ
                "tileSize": 256,
                // 地図データの著作権情報や出典を示すための属性
                "attribution": "&copy; OpenStreetMap Contributors",
                // 地図がズームインできる最大のレベルを指定するプロパティ
                "maxzoom": 19
            }
        },
        // 地図のレイヤーを定義している
        "layers": [
            {
                // レイヤーの一意の識別子を指定
                "id": "osm",
                // "raster"は、ラスタータイプのデータを表示するためのレイヤーです。地図タイルが画像として提供される場合に使用されます
                "type": "raster",
                // このレイヤーが使用するソース（データの出所）を指定します
                "source": "osm" // 上記のsourcesのキーと一致する必要があります
            }
        ]
    },
     // 開始位置 [lng, lat]
    center: [141.34867329542533, 43.0598172943666],
    // 開始ズーム
    zoom: 13 
});

// 地図にナビゲーションコントロールを追加
map.addControl(new maplibregl.NavigationControl());

// 座標を保存する配列
var points = [];

// ユニーク(一意)なクライアントIDを生成
let client_id = Date.now();
// id=ws-idを取得してそこにtextcontentでclient_idを表示する
document.querySelector("#ws-id").textContent = client_id;

// ホスト名の定義
let hostName = "localhost:8000";
// 実際にアクセスするWebsocket のurl
let ws = new WebSocket(`ws://${hostName}/ws/${client_id}/location`);

// サーバーからのメッセージを処理
ws.onmessage = function (event) {
    // マーカーを地図に追加
    // JSONデータをJavaScriptのオブジェクトに変換してmarkersキーにアクセスしてObject.keys()でこのオブジェクトのキーの配列を返します。
    // forEachはこのキーの配列に対して、各キー（key）について繰り返し処理を行います
    Object.keys(JSON.parse(event.data).markers).forEach((key, index) => {
        // keyに対応するマーカーの座標を取得します。
        let coordinate = JSON.parse(event.data).markers[key].coordinate;
        // keyに対応するマーカーのmarker_sizeを取得
        let marker_size = JSON.parse(event.data).markers[key].marker_size;

        // もしid=keyが既にあるなら
        if (document.getElementById(key)) {
            // 既存のマーカーがあれば削除
            document.getElementById(key).remove();
        }

        // マーカー要素を作成
        // divタグを生成
        let el = document.createElement('div');
        // div id = keyの値とする
        el.id = key;
        // div class ='marker'にする
        el.className = 'marker';
        // divのCSS、backgroundImageを設定
        el.style.backgroundImage =
            // url(写真のURL/縦幅/横幅)
            el.style.backgroundImage = 'url(./img/WIN_20240521_09_23_39_Pro.jpg)';
        // divの横幅
        el.style.width = marker_size + 'px';
        // divの縦幅
        el.style.height = marker_size + 'px';

        // マーカーをクリックしたときのイベントリスナーを追加
        el.addEventListener('click', function () {
            // マーカーに関連付けられた一意の識別子がアラートされる
            window.alert(key);
        });

        // マーカーを地図に追加
        // 引数(el)=divタグを使い新しいマーカオブジェクトを生成
        new maplibregl.Marker(el)
            // マーカーの地理座標を設定(coordinate 文字列をカンマで分割し、各部分を要素とする配列を作成)、配列の各要素の文字列を浮動小数点数に変換し地理座標の文字列が数値に変換する
            .setLngLat(coordinate.split(',').map(parseFloat)) // 座標を数値に変換して配列にする
            // マーカーオブジェクトを指定された地図に追加します。
            .addTo(map);

        // 座標を保管する points 配列に座標を追加
        points.push(coordinate.split(',').map(parseFloat)); // 座標を数値に変換して配列にする

        // ポイントの GeoJSON FeatureCollection(データのまとまり) を作成
        const pointsCollection = turf.featureCollection(points.map(point => turf.point(point)));

        // 引数には座標が含まれているので座標の集合から矩形の境界ボックスを計算する
        const bbox = turf.bbox(pointsCollection);
        // 指定された境界ボックスに基づいて地図の表示領域を調整
        map.fitBounds([
            // 最初の座標ペアは、表示領域の左上隅、2 番目の座標ペアは右下隅を表します。
            [bbox[0], bbox[1]],
            [bbox[2], bbox[3]]
        ]);
    });
};

// 選択した場所をサーバーに送信する関数
function sendMessage(event) {
    // Websocketにドロップダウンメニューから選択された値を取得し対応する座標を、loc_coordinat オブジェクトから取得し送信
    ws.send(loc_coordinat[document.getElementById("myDropdown").value])
    // 処理を行ってもページをリロードしないようにする処理
    event.preventDefault();
}
