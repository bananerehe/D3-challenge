// Define dimensions
var svgWidth = 800;
var svgHeight = 800;

// Define margins
var margin = {
  top: 30,
  right: 30,
  bottom: 90,
  left: 90
};

// Dimensions of chart
var chartWidth = svgWidth - margin.left - margin.right;
var chartHeight = svgHeight - margin.top - margin.bottom;
var svg = d3.select("#scatter")
  .append("svg")
  .attr("class", "chart")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

// Set margins
var chartGroup = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);
var radiusState = 10;

// Parameters
let chosenXAxis = "poverty";
let chosenYAxis = "obesity";

// Update xScale on label click
function xScale(censusData, chosenXAxis) {
    var xLinearScale = d3.scaleLinear()
        .domain(d3.extent(censusData.map(d => d[chosenXAxis])))
        .range([0, chartWidth])
        .nice();
    return xLinearScale
};

// Update yScale on label click
function yScale(censusData, chosenYAxis) {
    var yLinearScale = d3.scaleLinear()
        .domain(d3.extent(censusData.map(d => d[chosenYAxis])))
        .range([chartHeight,0])
        .nice();
    return yLinearScale
};

// Update xAxis on label click
function renderXAxes(newXScale, xAxis) {
    var bottomAxis = d3.axisBottom(newXScale);
    xAxis.transition()
        .duration(1000)
        .call(bottomAxis);
    return xAxis;
}

// Update yAxis on label click
function renderYAxes(newYScale, yAxis) {
    var leftAxis = d3.axisLeft(newYScale);
    yAxis.transition()
        .duration(1000)
        .call(leftAxis);
    return yAxis;
}

// Update circles
function renderCircles(circlesGroup, newXScale, newYScale, chosenXAxis, chosenYAxis) {
    circlesGroup.transition()
      .duration(1000)
      .attr("cx", d => newXScale(d[chosenXAxis]))
      .attr("cy", d => newYScale(d[chosenYAxis]));
    return circlesGroup;
}
function renderAbbrs(stateTextGroup, newXScale, newYScale, chosenXAxis, chosenYAxis) {
    stateTextGroup.transition()
      .duration(1000)
      .attr("x", (d=>newXScale(d[chosenXAxis])))
      .attr("y", (d=>newYScale(d[chosenYAxis])+5));
    return stateTextGroup;
}

// Update tooltips
function updateToolTip(chosenXAxis, chosenYAxis, stateTextGroup) {
    var xLabel;
    if (chosenXAxis == "poverty") {
      xLabel = "In Poverty";
      xUnit = "%";
    } else if (chosenXAxis == "age") {
      xLabel = "Median Age";
      xUnit = "";
    } else if (chosenXAxis == "income") {
      xLabel = "Median Household Income";
      xUnit = "";  
    }

    var yLabel;
    if (chosenYAxis == "obesity") {
      yLabel = "Obesity";
      yUnit ="%";
    } else if (chosenYAxis == "smokes") {
      yLabel = "Smokes";
      yUnit ="%";
    } else if (chosenYAxis == "healthcare") {
      yLabel = "Lacks Healthcare"; 
      yUnit ="%"; 
    }

    // Initialize tooltips
    var toolTip = d3.tip()
      .attr("class", "d3-tip")
      .offset([40, -80])
      .html(d => `<strong>${d.state}</strong><br>${xLabel}: ${d[chosenXAxis]}${xUnit}<br>${yLabel}: ${d[chosenYAxis]}${yUnit}`);
  
    stateTextGroup.call(toolTip);
    
    stateTextGroup.on("mouseover", function(d) {
        toolTip.show(d, this);
        chartGroup.selectAll('.tempCircle')
            .data("1")
            .enter()
            .append("circle")
            .attr("cx", d3.select(this).attr("x"))
            .attr("cy", d3.select(this).attr("y")-5)
            .attr("r", 10)
            .style("stroke", "gray")
            .style("stroke-width", 2)
            .style("fill","none")
            .classed("tempCircle",true);
    })
    
        .on("mouseout", function(d) {
            toolTip.hide(d);
            d3.selectAll('.tempCircle').remove();
        });
    return stateTextGroup;
}

// Load data
d3.csv("assets/data/data.csv").then(function(censusData){
    censusData.forEach(function(d){
        d.poverty=+d.poverty;
        d.age=+d.age;
        d.smokes=+d.smokes;
        d.income=+d.income;
        d.healthcare=+d.healthcare;
        d.obesity=+d.obesity;
    });

    var xLinearScale = xScale(censusData, chosenXAxis);
    var yLinearScale = yScale(censusData, chosenYAxis);

    var bottomAxis = d3.axisBottom(xLinearScale).ticks(8);
    var leftAxis = d3.axisLeft(yLinearScale);

    yAxis = chartGroup.append("g")
        .call(leftAxis);
    xAxis = chartGroup.append("g")
        .attr("transform", `translate(0, ${chartHeight})`)
        .call(bottomAxis);

    // Add circles
    var circlesGroup = chartGroup.selectAll("circle")
        .data(censusData)
        .enter()
        .append("circle")
        .attr("cx", d=>xLinearScale(d[chosenXAxis]))
        .attr("cy", d=>yLinearScale(d[chosenYAxis]))
        .attr("r", radiusState)
        .attr("class", "stateCircle");

    // Add labels
    let stateTextGroup = chartGroup.selectAll(".stateText")
        .data(censusData)
        .enter()
        .append("text")
        .text(d=>d.abbr)
        .attr("x", (d=>xLinearScale(d[chosenXAxis])))
        .attr("y", (d=>yLinearScale(d[chosenYAxis])+5))
        .attr("class","stateText")
        .attr("font-size", radiusState);

    // X-axis labels group
    var xLabelsGroup = chartGroup.append("g")
        .classed("aText", true)
        .attr("transform", `translate(${chartWidth / 2}, ${chartHeight + 20})`);
    var povertyLabel = xLabelsGroup.append("text")
        .attr("x", 0)
        .attr("y", 20)
        .attr("value", "poverty")
        .classed("active", true)
        .text("In Poverty (%)");
    var ageLabel = xLabelsGroup.append("text")
        .attr("x", 0)
        .attr("y", 40)
        .attr("value", "age")
        .classed("inactive", true)
        .text("Age (Median)");
    var incomeLabel = xLabelsGroup.append("text")
        .attr("x", 0)
        .attr("y", 60)
        .attr("value", "income")
        .classed("inactive", true)
        .text("Household Income (Median)");
    
    // Y-axis labels group
    var yLabelsGroup = chartGroup.append("g")
        .classed("aText", true)
        .attr("transform", "rotate(-90)");
    var obesityLabel = yLabelsGroup.append("text")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (chartHeight / 2))
        .attr("value", "obesity")
        .classed("active", true)
        .attr("dy", "1em")
        .text("Obesity (%)");
    var smokesLabel = yLabelsGroup.append("text")
        .attr("y", 20 - margin.left)
        .attr("x", 0 - (chartHeight / 2))
        .attr("value", "smokes")
        .classed("inactive", true)
        .attr("dy", "1em")
        .text("Smokes (%)");
    var healthcareLabel = yLabelsGroup.append("text")
        .attr("y", 40 - margin.left)
        .attr("x", 0 - (chartHeight / 2))
        .attr("value", "healthcare")
        .classed("inactive", true)
        .attr("dy", "1em")
        .text("Lacks Healthcare (%)");

    // Update tooltips
    stateTextGroup = updateToolTip(chosenXAxis, chosenYAxis, stateTextGroup);

    // X-axis event listener
    xLabelsGroup.selectAll("text").on("click", function() {
        var value = d3.select(this).attr("value");
        if (value !== chosenXAxis) {
            chosenXAxis = value;
            xLinearScale = xScale(censusData, chosenXAxis);

            xAxis = renderXAxes(xLinearScale, xAxis);

            circlesGroup = renderCircles(circlesGroup, xLinearScale, yLinearScale, chosenXAxis, chosenYAxis);
            stateTextGroup = renderAbbrs(stateTextGroup, xLinearScale, yLinearScale, chosenXAxis, chosenYAxis);

            stateTextGroup = updateToolTip(chosenXAxis, chosenYAxis, stateTextGroup);

            // Bold text
            if (chosenXAxis == "poverty") {
                povertyLabel
                .classed("active", true)
                .classed("inactive", false);
                ageLabel
                .classed("active", false)
                .classed("inactive", true);
                incomeLabel
                .classed("active", false)
                .classed("inactive", true);
            } else if (chosenXAxis == "age") {
                povertyLabel
                .classed("active", false)
                .classed("inactive", true);
                ageLabel
                .classed("active", true)
                .classed("inactive", false);
                incomeLabel
                .classed("active", false)
                .classed("inactive", true);
            } else if (chosenXAxis == "income") {
                povertyLabel
                .classed("active", false)
                .classed("inactive", true);
                ageLabel
                .classed("active", false)
                .classed("inactive", true);
                incomeLabel
                .classed("active", true)
                .classed("inactive", false);
            }
        }
    });
    // Y-axis event listener
    yLabelsGroup.selectAll("text").on("click", function() {
        var value = d3.select(this).attr("value");
        if (value !== chosenYAxis) {
            chosenYAxis = value;
            yLinearScale = yScale(censusData, chosenYAxis);

            yAxis = renderYAxes(yLinearScale, yAxis);

            circlesGroup = renderCircles(circlesGroup, xLinearScale, yLinearScale, chosenXAxis, chosenYAxis);
            stateTextGroup=renderAbbrs(stateTextGroup, xLinearScale, yLinearScale, chosenXAxis, chosenYAxis);

            stateTextGroup = updateToolTip(chosenXAxis, chosenYAxis, stateTextGroup);

            // Bold text
            if (chosenYAxis === "obesity") {
                obesityLabel
                .classed("active", true)
                .classed("inactive", false);
                smokesLabel
                .classed("active", false)
                .classed("inactive", true);
                healthcareLabel
                .classed("active", false)
                .classed("inactive", true);
            } else if (chosenYAxis === "smokes") {
                obesityLabel
                .classed("active", false)
                .classed("inactive", true);
                smokesLabel
                .classed("active", true)
                .classed("inactive", false);
                healthcareLabel
                .classed("active", false)
                .classed("inactive", true);
            } else if (chosenYAxis === "healthcare") {
                obesityLabel
                .classed("active", false)
                .classed("inactive", true);
                smokesLabel
                .classed("active", false)
                .classed("inactive", true);
                healthcareLabel
                .classed("active", true)
                .classed("inactive", false);
            };
        };
    });
}).catch(function(error) {
console.log(error);
});
