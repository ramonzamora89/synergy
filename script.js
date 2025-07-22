const svg = d3.select("svg"),
  width = +svg.attr("width"),
  height = +svg.attr("height");

svg.style("background-color", "#ffffff");

// Márgenes para ejes y leyenda
const margin = { top: 100, right: 220, bottom: 30, left: 100 };

// Escalas
const xScale = d3.scalePoint()
  .domain(["Bajo", "Medio", "Alto"])
  .range([margin.left + 50, width - margin.right - 50]);

const yScale = d3.scalePoint()
  .domain(["Bajo", "Medio", "Alto"])
  .range([height - margin.bottom, margin.top]);

const colorMap = {
  "Socios estratégicos": "#fae48b",
  "Municipalidad": "#69c8ec",
  "Colonias": "#e89242"
};

// Tooltip
const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("padding", "10px")
  .style("background", "#f9f9f9")
  .style("border", "1px solid #ccc")
  .style("border-radius", "4px")
  .style("pointer-events", "none")
  .style("font-size", "12px")
  .style("display", "none");

d3.json("data.nodes.cartesiano.json").then(nodes => {
  nodes.forEach(d => {
    d.targetX = xScale(d.interest);
    d.targetY = yScale(d.influence);
  
    // Desplazamiento adicional para evitar superposición con ejes
    if (d.interest === "Bajo") d.targetX += 60;
    if (d.influence === "Bajo") d.targetY -= 90;
  });

  const simulation = d3.forceSimulation(nodes)
    .force("x", d3.forceX(d => d.targetX).strength(0.5))
    .force("y", d3.forceY(d => d.targetY).strength(0.5))
    .force("collide", d3.forceCollide(25))
    .alphaDecay(0.05)
    .on("tick", ticked);

  // Ejes
  svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale));

  svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale));

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 40)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Interés");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Influencia");

  // Nodos
  const node = svg.selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", 20)
    .attr("fill", d => colorMap[d.group] || "#ccc")
    .attr("stroke", "#333")
    .attr("stroke-width", 1)
    .on("mouseover", function (event, d) {
      tooltip
        .style("display", "block")
        .html(
          `<strong>${d.id}</strong><br/>
          <em>${d.group}</em><br/><br/>
          <strong>Rol:</strong> ${d.rol || "—"}<br/>
          <strong>Estrategia:</strong> ${d.estrategia || "—"}`
        );
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", event.pageX + 15 + "px")
        .style("top", event.pageY - 30 + "px");
    })
    .on("mouseout", function () {
      tooltip.style("display", "none");
    });

  const labels = svg.selectAll("text.label")
    .data(nodes)
    .join("text")
    .attr("class", "label")
    .attr("text-anchor", "middle")
    .style("font-size", "11px")
    .text(d => d.id);

  function ticked() {
    node
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);

    labels
      .attr("x", d => d.x)
      .attr("y", d => d.y + 35);
  }

  // Leyenda fuera del área de visualización
  const legend = svg.append("g")
    .attr("transform", `translate(${width - margin.right + 80}, ${margin.top})`);

  Object.entries(colorMap).forEach(([group, color], i) => {
    const g = legend.append("g").attr("transform", `translate(0, ${i * 30})`);
    g.append("circle").attr("r", 8).attr("fill", color).attr("cx", 0).attr("cy", 0);
    g.append("text").text(group).attr("x", 15).attr("y", 5).style("font-size", "12px");
  });

  // Botón exportar PNG
  document.getElementById('saveBtn').addEventListener('click', () => {
    const svgNode = svg.node();
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgNode);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = function () {
      ctx.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.download = "mapa_synergy_cartesiano.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgString)));
  });
});
