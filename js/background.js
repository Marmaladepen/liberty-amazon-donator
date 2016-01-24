/*
 * Always runs in background, and redirects current Amazon URL with selected affiliate tag added.
 */

var AMAZON_AFFILIATE_URL_TAG = "tag";

var amazonAffiliatesDefault = {
    'freedomain-radio': {
        'name': 'Freedomain Radio',
        'description': "Freedomain Radio, with host Stefan Molyneux, is the largest and most popular philosophy show on the world, with over 75 million downloads. The show covers subjects ranging from politics, philosophy, science, atheism and economics to relationships, parenting and how to achieve real freedom in your life today. ",
        'url': "http://freedomainradio.com",
        'trackIds': {
            'US': "freedomainradio-20",
            'CA': "freedradio03-20",
            'UK': "freedomainradio-21"
        },
        'probability': 0.2,
        'pickedcount': 0, lastpickeddate: 0
    },

    'tom-woods': {
        'name': 'Tom Woods',
        'description': "Thomas E. Woods, Jr., is a senior fellow of the Mises Institute and host of The Tom Woods Show. Master the freedom philosophy and hone your debating skills, Monday through Friday.",
        'url': "http://tomwoods.com",
        'trackIds': {
            'US': "thomacom-20"
        },
        'probability': 0.2,
        'pickedcount': 0, lastpickeddate: 0
    },

    'lew-rockwell': {
        'name': 'Lew Rockwell',
        'description': "The daily news and opinion site LewRockwell.com was founded in 1999 by anarcho-capitalists Lew Rockwell and Burt Blumert to help carry on the anti-war, anti-state, pro-market work of Murray N. Rothbard.",
        'url': "http://lewrockwell.com",
        'trackIds': {
            'US': "lewrockwell"
        },
        'probability': 0.2,
        'pickedcount': 0, lastpickeddate: 0
    },

    'christopher-cantwell': {
        'name': 'Christopher Cantwell',
        'description': "Christopher Cantwell is an activist, writer, and satirist originally from New York. From an anarcho-capitalist perspective, he covers news and current events, addresses philosophical questions, and even cracks a joke or two at ChristopherCantwell.com. He is also the host of Radical Agenda, a twice weekly podcast.",
        'url': "http://christophercantwell.com",
        'trackIds': {
            'US': "christophe0a9-20",
            'CA': "christcantwe-21",
            'UK': "christophe0d0-20"
        },
        'probability': 0.2,
        'pickedcount': 0, lastpickeddate: 0
    },

    'seasteading-institute': {
        'name': 'Seasteading Institute',
        'description': "Seasteaders are a diverse global team of marine biologists, nautical engineers, aquaculture farmers, maritime attorneys, medical researchers, security personnel, investors, environmentalists, and artists. We plan to build seasteads to host profitable aquaculture farms, floating healthcare, medical research islands, and sustainable energy powerhouses. Our goal is to maximize entrepreneurial freedom to create blue jobs to welcome anyone to the Next New World.",
        'url': "http://seasteading.org",
        'trackIds': {
            'US': "theseastins0f-20"
        },
        'probability': 0.2,
        'pickedcount': 0, lastpickeddate: 0
    }
};


var amazonCountriesDefault = {
    'US': {
        'extension': 'com',
        'countryName': 'United States',
        'amazonLink': 'Amazon.com'
    },
    'CA': {
        'extension': 'ca',
        'countryName': 'Canada',
        'amazonLink': 'Amazon.ca'
    },
    'UK': {
        'extension': 'co.uk',
        'countryName': 'United Kingdom',
        'amazonLink': 'Amazon.co.uk'
    },
    'DE': {
        'extension': 'de',
        'countryName': 'Germany & Austria',
        'amazonLink': 'Amazon.at & Amazon.de'
    },
    'ES': {
        'extension': 'es',
        'countryName': 'Spain',
        'amazonLink': 'Amazon.es'
    },
    'FR': {
        'extension': 'fr',
        'countryName': 'France',
        'amazonLink': 'Amazon.fr'
    },
    'IT': {
        'extension': 'it',
        'countryName': 'Italy',
        'amazonLink': 'Amazon.it'
    },
    'JP': {
        'extension': 'co.jp',
        'countryName': 'Japan',
        'amazonLink': 'Amazon.co.jp'
    },
    'CN': {
        'extension': 'cn',
        'countryName': 'China',
        'amazonLink': 'Amazon.cn (Joyo.com)'
    }
};

var defaultTimeoutHours = 24;
var amazonCountries = Lockr.get("amazonCountries", amazonCountriesDefault);
var amazonAffiliates = Lockr.get("amazonAffiliates", amazonAffiliatesDefault);
var affiliateUpdateTimeOutHours = Lockr.get("affiliateUpdateTimeOutHours", defaultTimeoutHours);
var lastAffiliateUpdateTime = Lockr.get("lastAffiliateUpdateTime", {});
var currentlySelectedAffiliate = Lockr.get("currentlySelectedAffiliate", {}); // load previous selection, otherwise init variable


/* Functions called from option.html/.js page */
function getAffiliateUpdateTimeOutHours() {
    return affiliateUpdateTimeOutHours;
}
function saveAffiliateUpdateTimeOutHours(hours) {
    affiliateUpdateTimeOutHours = hours;
    Lockr.set("affiliateUpdateTimeOutHours", affiliateUpdateTimeOutHours);
}

function getLastAffiliateUpdateTime() {
    return lastAffiliateUpdateTime;
}
function getCurrentlySelectedAffiliate() {
    return currentlySelectedAffiliate;
}
function getAmazonCountries() {
    return amazonCountries;
}

function getAmazonAffiliates() {
    return amazonAffiliates;
}

function reloadAmazonAffiliates() {
    amazonAffiliates = Lockr.get("amazonAffiliates", amazonAffiliatesDefault);
}

function saveAmazonAffiliates(updatedAffiliates) {
    amazonAffiliates = updatedAffiliates;
    Lockr.set("amazonAffiliates", updatedAffiliates);
}

function resetAll() {
    amazonAffiliates = jQuery.extend(true, {}, amazonAffiliatesDefault); //deep copy
    Lockr.set("amazonAffiliates", amazonAffiliates);
    affiliateUpdateTimeOutHours = defaultTimeoutHours;
    Lockr.set("affiliateUpdateTimeOutHours", affiliateUpdateTimeOutHours);
    lastAffiliateUpdateTime = {};
    Lockr.set("lastAffiliateUpdateTime", lastAffiliateUpdateTime);
    currentlySelectedAffiliate = {};
    Lockr.set("currentlySelectedAffiliate", currentlySelectedAffiliate);
}

/**
 * returns the url with key-value pair added to the parameter string.
 *
 * @param url
 * @param key
 * @param value
 * @returns {string}
 */
function insertParam(url, key, value) {
    if (url.indexOf('?') != -1) {
        var pairset = url.split('&');

        var i = pairset.length;
        var pair;

        key = escape(key);
        value = escape(value);

        while (i--) {
            pair = pairset[i].split('=');

            if (pair[0] == key) {
                pair[1] = value;
                pairset[i] = pair.join('=');
                break;
            }
        }

        if (i < 0) {
            pairset[pairset.length] = [key, value].join('=');
        }

        return pairset.join('&');
    }
    else {
        return url + '?' + [key, value].join('=');
    }
}

/**
 *  listen for click on the extensions toolbar button
 */
chrome.browserAction.onClicked.addListener(
    function (tab) {
        // Open the Amazon deals page
        chrome.tabs.create(
            {
                'url': 'http://www.amazon.com/deals',
                'selected': true
            },
            function (tab) {
                // tab opened, further processing takes place in content.js                
            }
        );
    }
);

/**
 * Gets a random affiliate Id code by sampling the current probability distribution of affiliates. If
 * an affiliate has already been selected for the current country Amazon website, just use that one
 * if we are within the 24 hour timeout.
 *
 * @param amazonAffiliates
 * @param countryId
 * @returns {*}
 */
function getRandomAffiliateTrackId(amazonAffiliates, countryId) {
    var trackIds = [];
    var probas = [];
    var affiliateIds = [];

    _.keys(amazonAffiliates).forEach(function (affiliateId) {
        var affiliate = amazonAffiliates[affiliateId];
        if (_.has(affiliate.trackIds, countryId)) {
            affiliateIds.push(affiliateId);
            trackIds.push(affiliate.trackIds[countryId]);
            probas.push(affiliate.probability);
        }
    });

    if (trackIds.length == 0) {
        return undefined; // no defined TrackIds for given country
    }


    // If within timeout, return previous pick
    if (!_.isUndefined(lastAffiliateUpdateTime[countryId]) &&
        $.now() - lastAffiliateUpdateTime[countryId] < affiliateUpdateTimeOutHours * 1000 * 60 * 60) {

        var previousAffiliateId = currentlySelectedAffiliate[countryId];
        return {
            'allTrackIds': trackIds,
            'randomTrackId': amazonAffiliates[previousAffiliateId].trackIds[countryId]
        };
    }


    var cumulativeDistribution = [];
    var i = 0;
    var sum = 0.0;

    for (i = 0; i < probas.length - 1; i++) {
        sum += probas[i];
        cumulativeDistribution[i] = sum;
    }

    var finalSum = sum + probas[i];

    // We get a random number and find where it sits inside the probabilities defined earlier.
    // Scale random [0,1] value by sum of probabilities in case we don't have probabilities that add up to 1.0
    // (e.g. when we don't have country codes for all affiliates)
    var r = Math.random() * finalSum;

    for (i = 0; i < cumulativeDistribution.length && r >= cumulativeDistribution[i]; i++);

    console.log("Random=" + r + " => picked=" + trackIds[i]);

    lastAffiliateUpdateTime[countryId] = $.now();
    currentlySelectedAffiliate[countryId] = affiliateIds[i];
    Lockr.set("lastAffiliateUpdateTime", lastAffiliateUpdateTime);
    Lockr.set("currentlySelectedAffiliate", currentlySelectedAffiliate);

    amazonAffiliates[affiliateIds[i]].pickedcount += 1;
    amazonAffiliates[affiliateIds[i]].lastpickeddate = $.now();
    Lockr.set("amazonAffiliates", amazonAffiliates);

    return {
        'allTrackIds': trackIds,
        'randomTrackId': trackIds[i]
    };
}

/**
 * Adds the selected afffiliate's tag to the current Amazon URL and redirect to it.
 *
 * @param countryId
 * @param details
 * @returns {*}
 */
function redirectOnQualifyingUrlRequest(countryId, details) {
    // only for the top-most window (ignore frames)
    if (window == top) {

        var getRandomAffiliateTrackIdResponse = getRandomAffiliateTrackId(amazonAffiliates, countryId);
        if (_.isUndefined(getRandomAffiliateTrackIdResponse)) {
            console.log("Warning: Could not find random valid affiliate"); //TODO remove
            return {}; // do nothing
        }
        var allAffiliateTrackIds = getRandomAffiliateTrackIdResponse.allTrackIds;
        var affiliateCodeTrackId = getRandomAffiliateTrackIdResponse.randomTrackId;
        console.log("affiliateCodeTrackId = " + affiliateCodeTrackId);

        // if the url does not already contain the tracking id
        var trackIdPresentInUrl = _.any(allAffiliateTrackIds, function (trackId) {
            return details.url.search(trackId) != -1;
        });

        if (!trackIdPresentInUrl &&
            details.url.search("ap/signin") == -1 &&
            details.url.search("ap/widget") == -1) {
            console.log("redirecting to " + insertParam(details.url, AMAZON_AFFILIATE_URL_TAG, affiliateCodeTrackId));
            // redirect them to the url with the new tracking id parameter inserted
            return {redirectUrl: insertParam(details.url, AMAZON_AFFILIATE_URL_TAG, affiliateCodeTrackId)};
        }
    }
}

/**
 * Set up all the listeners to listen for new web page requests to the amazon website for each country
 */
_.keys(amazonCountries).forEach(function (countryId) {
    var countryExtension = amazonCountries[countryId].extension;
    var httpUrl = "http://www.amazon." + countryExtension + "/*";
    var httpsUrl = "https://www.amazon." + countryExtension + "/*";

    chrome.webRequest.onBeforeRequest.addListener(
        function (details) {
            return redirectOnQualifyingUrlRequest(countryId, details);
        },
        {urls: [httpUrl, httpsUrl]}, // only run for requests to the following urls
        ['blocking']    // blocking permission necessary in order to perform the redirect
    );
});