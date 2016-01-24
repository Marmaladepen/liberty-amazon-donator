/*
 * Script for dealing with Chrome extension settings/options page
 */

var backgroundPage = chrome.extension.getBackgroundPage();
var amazonCountries = backgroundPage.getAmazonCountries();
var amazonAffiliates = backgroundPage.getAmazonAffiliates();

/**
 * Calculates the sum of the modified and unmodified probabilities
 *
 * @returns {{sumRemainingProbabilities: number, sumChangedProbabilities: number}}
 */
function calculateSumProbabilities() {
    var sumRemainingProbabilities = 0.0;
    var sumChangedProbabilities = 0.0;
    _.keys(amazonAffiliates).forEach(function (affiliateId) {
        var affiliate = amazonAffiliates[affiliateId];
        var probabilityField = $('#' + affiliateId + '-probability');
        var userProbability = Number(probabilityField.val());
        var originalUserProbability = Number(probabilityField.attr('old_value'));

        if (originalUserProbability == userProbability) {
            sumRemainingProbabilities += originalUserProbability / 100.0;
        } else if (
            !_.isUndefined(userProbability) && !_.isNaN(userProbability) &&
            userProbability <= 100
        ) {
            sumChangedProbabilities += userProbability / 100.0;
        }

    });
    return {
        'sumRemainingProbabilities': sumRemainingProbabilities,
        'sumChangedProbabilities': sumChangedProbabilities
    };
}

/**
 * Saves new user settings to localStorage.
 */
function save_options() {

    var sumProbabilities = calculateSumProbabilities();

    var updatedRemainingProbabilities = false;
    _.keys(amazonAffiliates).forEach(function (affiliateId) {
        var affiliate = amazonAffiliates[affiliateId];

        var probabilityField = $('#' + affiliateId + '-probability');
        var userProbability = Number(probabilityField.val());
        var originalUserProbability = Number(probabilityField.attr('old_value'));

        console.log("save_options: id=" + affiliateId + "   proba=" + userProbability + "   old_proba=" + originalUserProbability);
        if (originalUserProbability != userProbability) { // see if it was changed by user
            if (!_.isUndefined(userProbability) && !_.isNaN(userProbability) &&
                userProbability <= 100) {
                affiliate.probability = userProbability / 100.0;

                if (!updatedRemainingProbabilities) {
                    updateRemainingProbabilities(affiliateId, affiliate.probability, sumProbabilities, false);
                    updatedRemainingProbabilities = true;
                }

            } else {
                alert("No probability entered. Please specify a probability (between 0% and 100%) of this entry being picked.");
                return;
            }
        }

        _.keys(amazonCountries).forEach(function (countryId) {
            var countryEntry = amazonCountries[countryId];
            var countryExt = countryEntry.extension;
            var countryTrackIdKey = affiliateId + "-trackId-" + countryId;

            var countryTrackId = $('#' + countryTrackIdKey).val();

            if (!_.isUndefined(countryTrackId) && !_.isEmpty(countryTrackId) //TODO want to save empty trackIds
            ) {
                console.log("countryTrackId : " + countryTrackId);
                affiliate.trackIds[countryId] = countryTrackId
            }

        });

    });

    backgroundPage.saveAmazonAffiliates(amazonAffiliates);

    var updateFrequency = $('#update-frequency').val();
    if (!_.isUndefined(updateFrequency) && !_.isNaN(updateFrequency)
    ) {
        backgroundPage.saveAffiliateUpdateTimeOutHours(Number(updateFrequency));
    }
}

/**
 * Restores saved value from localStorage and display them
 */
function reload_options() {

    console.log("RESTORE OPTIONS CALLED");

    var accordion = $("#accordion");

    accordion.empty();

    _.keys(amazonAffiliates).forEach(function (affiliateId) {
        var affiliate = amazonAffiliates[affiliateId];

        var affiliateProbability = Math.round(affiliate.probability * 100);
        accordion.append($('<H3>').text(affiliate.name + ' (' + affiliateProbability + '%)'));

        var affiliateDiv = $('<div>');

        var img = $('<img>')
            .attr('src', 'images/' + affiliateId + '.png')
            .text('Affiliate Icon for ' + affiliate.name);
        if (affiliateId.lastIndexOf("ui-id-", 0) === 0)
            img = '';

        affiliateDiv
            .append($('<table>')
                .attr('border', '1px solid black')
                .attr('width', '100%')
                .append($('<tr>')
                    .append($('<th>')
                        .width(200)
                        .html("Name")
                    )
                    .append($('<th>')
                        .html("Description")
                    )
                    .append($('<th>')
                        .width(200)
                        .html("Link")
                    )
                )
                .append($('<tr>')
                    .append($('<td>')
                        .html('<b>' + affiliate.name + '</b><br/>')
                        .append(img)
                    )
                    .append($('<td>')
                        .html(affiliate.description)
                    )
                    .append($('<td>')
                        .html('<a href="' + affiliate.url + '">' + affiliate.url + '</a>')
                    )
                )
            );


        var countriesTable = $('<table>')
            .attr('width', '100%')
            .append($('<tr>')
                .append($('<th>')
                    .html("Amazon Website")
                )
                .append($('<th>')
                    .html("Amazon Affiliate Code")
                )
            );

        _.keys(amazonCountries).forEach(function (countryId) {
            var countryEntry = amazonCountries[countryId];
            var countryExt = countryEntry.extension;
            var countryTrackIdKey = "trackId-" + countryId;
            var trackId = affiliate.trackIds[countryId];
            if (_.isUndefined(trackId)) trackId = '';
            console.log(countryTrackIdKey + " has trackId from localstorage = " + trackId);

            countriesTable
                .append($('<tr>')
                    .append($('<td>')
                        .append($('<img>')
                            .attr('src', 'images/flag-' + countryId + '.gif')
                            .text('Amazon ' + countryId)
                        )
                        .append($('<span>')
                            .html(' <a href="http://www.amazon.' + countryExt + '">' + countryEntry.countryName + ' - ' + countryEntry.amazonLink + '</a>')
                        )
                    )
                    .append($('<td>')
                        .html('<input id="' + affiliateId + '-trackId-' + countryId + '" type="text" value="' + trackId + '"/>')
                    )
                );

        });

        affiliateDiv
            .append('<br/><br/>')
            .append(countriesTable);

        affiliateDiv.append($('<span>')
            .html('<br/><br/>Number of times selected: ' + affiliate.pickedcount));
        var lastPickedDate = (affiliate.lastpickeddate == 0) ? 'Never' : new Date(affiliate.lastpickeddate).toLocaleString();
        affiliateDiv.append($('<span>')
            .html('<br/><br/>Date last selected: ' + lastPickedDate));

        affiliateDiv.append($('<span>')
            .html('<br/><br/><font size="+1">Probability of being picked: ' +
                '<input id="' + affiliateId + '-probability" ' +
                'size="5" type="text" ' +
                'old_value="' + affiliateProbability + '" ' +
                ' value="' + affiliateProbability + '"/>%</font>')
        );

        //TODO confirmation dialog box
        affiliateDiv
            .append('<br/><br/>')
            .append($('<button>')
                .attr('id', affiliateId + '-delete-button')
                .attr('type', 'submit')
                .attr('title', 'Delete entry for ' + affiliate.name)
                .html('Remove')
                .click(function () {
                    var proceed = confirm("Are you sure you want to completely remove the entry for " + affiliate.name + "?");
                    if (!proceed) return;
                    delete amazonAffiliates[affiliateId];
                    backgroundPage.saveAmazonAffiliates(amazonAffiliates);
                    reload_options();
                })
            );

        accordion.append(affiliateDiv);

    });

    accordion.append($('<H3>').text('Add'));

    var newDiv = $('<div>')
        .html($("#new-affiliate-form").html())
        .append('<br/><br/>')
        // Add button
        .append($('<button>')
            .attr('id', 'active-new-affiliate-add-button')
            .attr('type', 'submit')
            .html('Add new Amazon affiliate')
            .click(addAffiliate)
        );
    // rename the IDs
    newDiv.find("input").each(function () {
        var curInput = $(this);
        var oldId = curInput.prop('id');
        curInput.prop('id', 'active-' + oldId);
    });


    accordion.append(newDiv);

    if (_.isUndefined(accordion.accordion("instance")))
        accordion.accordion();
    else
        accordion.accordion("refresh");

    $('#update-frequency').val(
        backgroundPage.getAffiliateUpdateTimeOutHours()
    );

    var currentlySelectedAffiliate = backgroundPage.getCurrentlySelectedAffiliate();
    var lastAffiliateUpdateTime = backgroundPage.getLastAffiliateUpdateTime();
    var currentDate = $.now();
    var selectionDetails = [];
    _.keys(amazonCountries).forEach(function (countryId) {
        var countryName = amazonCountries[countryId].countryName;
        var affiliateId = currentlySelectedAffiliate[countryId];
        if (!_.isUndefined(affiliateId)) {
            var affiliate = amazonAffiliates[affiliateId];
            var hoursLastPicked = Math.round((currentDate - Number(lastAffiliateUpdateTime[countryId])) / ( 1000 * 60 * 60));
            hoursLastPicked = (_.isUndefined(hoursLastPicked)) ? '_' : hoursLastPicked;
            selectionDetails.push(countryName + " : " + affiliate.name + " (picked " + hoursLastPicked + " hours ago)");
        }
    });

    $('#current-selection').html(
        selectionDetails.join(', ')
    );
}

/**
 * Updates the probabilities of the entries which were not changed by the user, in such a way that the
 * total sum of all probabilities equals 1
 *
 * @param affiliateIdToUpdate
 * @param userProbability
 * @param sumProbabilities
 * @param ignoreField
 */
function updateRemainingProbabilities(affiliateIdToUpdate, userProbability, sumProbabilities, ignoreField) {
    var remainingShare = 1 - sumProbabilities.sumChangedProbabilities;
    _.keys(amazonAffiliates).forEach(function (affiliateId) {

        var probabilityField = $('#' + affiliateId + '-probability');
        var userProbability = Number(probabilityField.val());
        var originalUserProbability = Number(probabilityField.attr('old_value'));

        if (affiliateId != affiliateIdToUpdate && (userProbability == originalUserProbability || ignoreField)) {
            var affiliate = amazonAffiliates[affiliateId];
            console.log("updateRemainingProbabilities: id=" + affiliateId + "   proba=" + affiliate.probability);
            affiliate.probability = affiliate.probability / sumProbabilities.sumRemainingProbabilities * remainingShare;
            console.log("updateRemainingProbabilities: id=" + affiliateId + "   new proba=" + affiliate.probability);
        }
    });
}

var newAffiliatePrefix = 'active-new-affiliate';

/**
 * Deals with user inputted new affiliate entry
 */
function addAffiliate() {

    var affiliateId = $('<div>').uniqueId().prop('id');
    console.log("------> Adding affiliate " + affiliateId);

    amazonAffiliates[affiliateId] = {};
    var affiliate = amazonAffiliates[affiliateId];

    var affiliateName = $('#' + newAffiliatePrefix + '-name').val();
    if (_.isUndefined(affiliateName) ||
        _.isEmpty(affiliateName)
    ) {
        alert("Name field must be defined to be able to add new Amazon affiliate.");
        delete amazonAffiliates[affiliateId];
        return;
    }
    affiliate.name = affiliateName;

    affiliate.pickedcount = 0;
    affiliate.lastpickeddate = 0;

    var affiliateDescription = $('#' + newAffiliatePrefix + '-description');
    affiliate.description = (_.isUndefined(affiliateDescription)) ? '' : affiliateDescription.val();

    var affiliateUrl = $('#' + newAffiliatePrefix + '-url');
    affiliate.url = (_.isUndefined(affiliateUrl)) ? '' : affiliateUrl.val();

    var userProbability = Number($('#' + newAffiliatePrefix + '-probability').val());

    if (!_.isUndefined(userProbability) && !_.isNaN(userProbability) &&
        userProbability <= 100
    ) {
        affiliate.probability = userProbability / 100.0;
        var sumProbabilities = {
            'sumRemainingProbabilities': 1.0,
            'sumChangedProbabilities': affiliate.probability
        };
        updateRemainingProbabilities(affiliateId, affiliate.probability, sumProbabilities, true); //TODO
    } else {
        alert("No probability entered. Please specify a probability (between 0% and 100%) of this entry being picked.");
        delete amazonAffiliates[affiliateId];
        return;
    }

    affiliate.trackIds = {};
    _.keys(amazonCountries).forEach(function (countryId) {
        var countryEntry = amazonCountries[countryId];
        var countryExt = countryEntry.extension;
        var countryTrackIdKey = newAffiliatePrefix + "-trackId-" + countryId;

        var countryTrackId = $('#' + countryTrackIdKey).val();


        if (!_.isUndefined(countryTrackId) && !_.isEmpty(countryTrackId) //TODO want to save empty trackIds
        ) {
            console.log("countryTrackId : " + countryTrackId);
            affiliate.trackIds[countryId] = countryTrackId;
        }

    });

    backgroundPage.saveAmazonAffiliates(amazonAffiliates);
    reload_options();
}

/**
 * Sets up buttons and loads current settings from localstorage
 */
$(document).ready(function () {

    $('#save-button').click(function () {
        save_options();
        reload_options();
    });

    $('#reset-button').click(function () {
        var proceed = confirm("Are you sure you want to reset all the affiliates, codes and stats to default values?");
        if (!proceed) return;

        console.log("Resetting settings to default values");
        backgroundPage.resetAll();
        amazonAffiliates = backgroundPage.getAmazonAffiliates();
        reload_options();
    });

    reload_options();
});

