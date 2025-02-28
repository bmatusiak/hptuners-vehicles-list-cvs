$(document).ready(function () {
    console.log("DOM ready.");

    // Check if the button is disabled:
    if ($("#build-vehicles").prop("disabled")) {
        // Button is disabled, attach the iframe load listener:
        function attachIframeLoadListener() {
            const iframe = $("#hpsite-vehicle-list");

            if (iframe.length === 0) {
                console.error("Iframe not found.");
                return;
            }

            iframe.on("load", function () {
                console.log("Iframe loaded, starting buildMakesList().");
                buildMakesList();
                iframe.off("load"); // Remove the event listener after it runs once.
            });

            console.log("Iframe load listener attached.");
        }

        attachIframeLoadListener(); // Attach the listener
    } else {
        console.log("Button is not disabled, skipping iframe load listener.");
    }

    window.reloadWindow = function reloadWindow() {
        window.location.reload()
    }

    function buildMakesList() {
        let allVehicles = []; // Store all vehicles from all makes.
        $($("#hpsite-vehicle-list")[0].contentDocument).find("body").find(".vehicle-supports").each(function (index, value) {
            var children = $(value).children();
            if (children.length == 1) {
                children = $(children[0]).children();
            }
            allVehicles = allVehicles.concat(buildVehiclesList(children)); // Collect vehicle lists
        });

        const csvText = convertToCSV(allVehicles);
        replaceIframeWithTextarea(csvText);
    }
    window.buildMakesList = buildMakesList;

    function buildVehiclesList(make) {
        var makeName = $(make[0]).attr("id");

        var vehiclesList = [];
        $(make[1]).find("table tbody").children().each(function (index, value) {
            if (index == 0) {
                return;
            }
            var vehicleInfo = $(value).children();
            var vehicle = {};
            vehicle.make = makeName;

            // Remove the <a> tag from the year cell:
            let yearCell = $(vehicleInfo[0]);
            yearCell.find("a").remove(); // Remove the <a> tag
            vehicle.year = yearCell.text().replace(/\s+/g, '').replace(/\n/g, '');

            // Expand two-digit year ranges and single years with century adjustment:
            vehicle.year = vehicle.year.replace(/(\d{2})(?:-(\d{2}))?/g, function (match, year1, year2) {
                let century1 = (parseInt(year1) >= 80) ? "19" : "20";
                if (year2) { // It's a range
                    let century2 = (parseInt(year2) >= 80) ? "19" : "20";
                    return century1 + year1 + "-" + century2 + year2;
                } else { // It's a single year
                    return century1 + year1;
                }
            });

            vehicle.model = $(vehicleInfo[1]).text().replace(/\s*\([^)]*\)\s*/g, '').trim();
            vehicle.credits = $(vehicleInfo[2]).text();

            vehiclesList.push(vehicle);
        })

        console.log(vehiclesList)
        return vehiclesList;
    }


    function convertToCSV(vehiclesList) {
        if (!vehiclesList || vehiclesList.length === 0) {
            return ""; // Return empty string if list is empty
        }

        const header = Object.keys(vehiclesList[0]).join(",");
        const rows = vehiclesList.map(vehicle => {
            return Object.values(vehicle).map(value => {
                // Escape double quotes and commas
                if (typeof value === 'string') {
                    return '"' + value.replace(/"/g, '""').replace(/,/g, ',') + '"';
                }
                return value;
            }).join(",");
        });

        return header + "\n" + rows.join("\n");
    }

    function replaceIframeWithTextarea(csvText) {
        const iframe = $("#hpsite-vehicle-list");

        if (iframe.length === 0) {
            console.error("Iframe not found.");
            return;
        }

        const textarea = $("<textarea></textarea>");
        textarea.val(csvText);
        textarea.css({
            width: "100%",
            height: "500px", // Adjust height as needed
            boxSizing: "border-box" // Ensure padding/border doesn't affect dimensions
        });

        iframe.replaceWith(textarea);

        $("#build-vehicles").remove(); // Remove the button
    }

});