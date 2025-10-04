function _topN(html) {
  const select = html`<select style="font-size: 28px;
                        font-family: Arial, Helvetica, sans-serif;
                        font-weight: bold;
                        color: #333;
                        border: 2px solid #666;
                        border-radius: 5px;
                        padding: 5px 10px;
                        margin: 0 10px;
                        cursor: pointer;
                        background-color: white;">
    <option value="5">5</option>
    <option value="10">10</option>
    <option value="15">15</option>
    <option value="20" selected>20</option>
    <option value="25">25</option>
    <option value="30">30</option>
    <option value="35">35</option>
    <option value="40">40</option>
    <option value="45">45</option>
    <option value="50">50</option>
    <option value="60">60</option>
    <option value="70">70</option>
    <option value="80">80</option>
    <option value="90">90</option>
    <option value="100">100</option>
  </select>`;

  select.value = "20";
  return select;
}


function _header(html, topN, viewof_topN) {
  const container = html`<div style="text-align: center; margin-top: 20px;">
    <h1 style="font-size: 32px;
               font-family: Arial, Helvetica, sans-serif;
               font-weight: bold;
               color: #333;
               display: inline-block;
               margin: 0;">
      收发邮件最多的前
    </h1>
    ${viewof_topN}
    <h1 style="font-size: 32px;
               font-family: Arial, Helvetica, sans-serif;
               font-weight: bold;
               color: #333;
               display: inline-block;
               margin: 0;">
      名用户互发邮件情况图
    </h1>
  </div>`;
  return container;
}


function _chart(d3,data)
{
  const width = 1080;
  const height = width;
  const innerRadius = Math.min(width, height) * 0.5 - 90;
  const outerRadius = innerRadius + 10;

  // Compute a dense matrix from the weighted links in data.
  const names = d3.sort(d3.union(data.map(d => d.source), data.map(d => d.target)));
  const index = new Map(names.map((name, i) => [name, i]));
  const matrix = Array.from(index, () => new Array(names.length).fill(0));
  for (const {source, target, value} of data) matrix[index.get(source)][index.get(target)] += value;

  const chord = d3.chordDirected()
      .padAngle(10 / innerRadius)
      .sortSubgroups(d3.descending)
      .sortChords(d3.descending);

  const arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

  const ribbon = d3.ribbonArrow()
      .radius(innerRadius - 1)
      .padAngle(1 / innerRadius);

  const colors = d3.quantize(d3.interpolateRainbow, names.length);

  const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "width: 100%; height: auto; font: 10px sans-serif;");

  // 添加样式来放大 title 文字
  svg.append("style")
      .text(`
        svg title {
          font-size: 30px;
        }
      `);

  const chords = chord(matrix);

  const group = svg.append("g")
    .selectAll()
    .data(chords.groups)
    .join("g");

  group.append("path")
      .attr("fill", d => colors[d.index])
      .attr("d", arc);

  group.append("text")
      .each(d => (d.angle = (d.startAngle + d.endAngle) / 2))
      .attr("dy", "0.35em")
      .attr("transform", d => `
        rotate(${(d.angle * 180 / Math.PI - 90)})
        translate(${outerRadius + 5})
        ${d.angle > Math.PI ? "rotate(180)" : ""}
      `)
      .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
      .text(d => names[d.index]);

  group.append("title")
      .text(d => `${names[d.index]}
${d3.sum(chords, c => (c.source.index === d.index) * c.source.value)} outgoing →
${d3.sum(chords, c => (c.target.index === d.index) * c.source.value)} incoming ←`);

  // 添加弦（ribbons）
  const ribbons = svg.append("g")
      .attr("fill-opacity", 0.75)
    .selectAll()
    .data(chords)
    .join("path")
      .attr("class", "ribbon")
      .style("mix-blend-mode", "multiply")
      .attr("fill", d => colors[d.target.index])
      .attr("d", ribbon)
    .append("title")
      .text(d => `${names[d.source.index]} -> ${names[d.target.index]}  发送邮件数：${d.source.value}`);

  // 添加鼠标悬停交互效果
  group
    .on("mouseover", function(event, d) {
      // 将所有弦变为灰色并降低透明度
      svg.selectAll(".ribbon")
        .transition()
        .duration(200)
        .style("fill", "#ccc")
        .style("fill-opacity", 0.2);

      // 高亮与当前节点相关的弦
      svg.selectAll(".ribbon")
        .filter(chord => chord.source.index === d.index || chord.target.index === d.index)
        .transition()
        .duration(200)
        .style("fill", chord => colors[chord.target.index])
        .style("fill-opacity", 0.75);
    })
    .on("mouseout", function() {
      // 恢复所有弦的原始颜色
      svg.selectAll(".ribbon")
        .transition()
        .duration(200)
        .style("fill", d => colors[d.target.index])
        .style("fill-opacity", 0.75);
    });

  return svg.node();
}


function _data(FileAttachment, topN){return(
FileAttachment(`top${topN}.csv`).csv({typed: true})
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["top5.csv", {url: new URL("./files/top5.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["top10.csv", {url: new URL("./files/top10.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["top15.csv", {url: new URL("./files/top15.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["top20.csv", {url: new URL("./files/top20.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["top25.csv", {url: new URL("./files/top25.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["top30.csv", {url: new URL("./files/top30.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["top35.csv", {url: new URL("./files/top35.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["top40.csv", {url: new URL("./files/top40.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["top45.csv", {url: new URL("./files/top45.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["top50.csv", {url: new URL("./files/top50.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["top60.csv", {url: new URL("./files/top60.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["top70.csv", {url: new URL("./files/top70.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["top80.csv", {url: new URL("./files/top80.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["top90.csv", {url: new URL("./files/top90.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["top100.csv", {url: new URL("./files/top100.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer("viewof topN")).define("viewof topN", ["html"], _topN);
  main.variable(observer("topN")).define("topN", ["Generators", "viewof topN"], (G, _) => G.input(_));
  main.variable(observer("header")).define("header", ["html", "topN", "viewof topN"], _header);
  main.variable(observer("chart")).define("chart", ["d3","data"], _chart);
  main.variable(observer("data")).define("data", ["FileAttachment", "topN"], _data);
  return main;
}