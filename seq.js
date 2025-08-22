inlets = 2;
outlets = 2;


PL = 8;

live = true;
if (LiveAPI === undefined) {
    live = false

    function LiveAPI() {
    }

    LiveAPI.prototype.call = function (var1, var2) {
    }

    function post(message) {
        console.log(message);
    }
}


function log() {

    for (var i = 0, len = arguments.length; i < len; i++) {
        var message = arguments[i];
        if (message && message.toString) {
            var s = message.toString();
            if (s.indexOf("[object ") >= 0) {
                s = JSON.stringify(message);
            }
            post(s);
        } else if (message === null) {
            post("<null>");
        } else {
            post(message);
        }
    }
    post("\n");
}


var cnt = 0;
var scale = 0;

var voices = [
    {lastNote: 60, baseNote: 60, len: 2, voice: 0, direction: 0, durs: [1, 2, 3]},
    {lastNote: 48, baseNote: 60, len: 1, voice: 1, direction: 0, durs: [1, 2, 3]},
    {lastNote: 40, baseNote: 60, len: 3, voice: 2, direction: 0, durs: [1, 2, 3]},
    {lastNote: 38, baseNote: 48, len: 4, voice: 3, direction: 0, durs: [1, 2, 3]}
];


function generateSumArray(target, items) {
    var result = [];
    var sumSoFar = 0;
    // Don't overshoot—stop when adding the smallest item would risk going over
    var minItem = Math.min.apply(null, items);

    // Keep adding random items while we can safely do so
    while (sumSoFar + minItem < target) {
        var pick = items[Math.floor(Math.random() * items.length)];
        if (sumSoFar + pick < target) {
            result.push(pick);
            sumSoFar += pick;
        }
        // else skip that pick and try again
    }

    // Try one more random pick to hit exactly
    var lastPick = items[Math.floor(Math.random() * items.length)];
    if (sumSoFar + lastPick === target) {
        result.push(lastPick);
    } else {
        // Compute missing amount
        var missing = target - sumSoFar;
        // Insert it at a random position (including start or end)
        var pos = Math.floor(Math.random() * (result.length + 1));
        result.splice(pos, 0, missing);
    }

    return result;
}


function findSequenceWithCondition(possibleSteps, sequenceLength) {

    var MAX_ATTEMPTS = 1000000;
    var attempts = 0;

    // --- Generation Loop ---
    while (attempts < MAX_ATTEMPTS) {
        var sequence = [0]; // Start sequence with the initial value 0
        var currentSum = 0;

        // Generate the rest of the sequence
        for (var i = 1; i < sequenceLength; i++) {
            // 1. Pick a random step
            var randomIndex = Math.floor(Math.random() * possibleSteps.length);
            var step = possibleSteps[randomIndex];
            // 2. Calculate the new sum
            currentSum += step;

            // 3. Add the new sum to the sequence
            sequence.push(currentSum);
        }

        // 4. Check the condition for the *last* element
        //    The modulo operator (%) in JS correctly handles negative numbers
        //    in a way suitable for this check (e.g., -10 % 12 is -10, but we want 2).
        //    A common way to get positive modulo is ((n % m) + m) % m
        var lastElement = sequence[sequence.length - 1];
        var moduloResult = ((lastElement % 7) + 7) % 7; // Ensures positive result [0, 11]

        if (moduloResult === 4) {
            // Found a valid sequence!
            // console.log(`Found sequence after ${attempts + 1} attempts.`); // Optional: log attempts
            return sequence;
        }

        attempts++; // Increment attempt counter if condition not met
    }

    // --- Failure Case ---
    log("did not found schillingerer chrod progression");
    return null; // Indicate that no sequence was found within the limits
}


var srm = findSequenceWithCondition([-2, -2, -2, 2, -4, -4, 4], PL);


function sign(x) {
    if (x > 0) return 1;
    if (x < 0) return -1;
    return 0;
}

var scaleComputed = [0, 2, 4, 5, 7, 9, 11];

function play() {


    scaleComputed = generateModeFromSteps(0, scale);

    for (var i = 0; i < voices.length; i++) {
        var voice = voices[i];

        if (cnt % voice.len == 0) {
            outlet(0, [voice.lastNote, 0, 0]);
            outlet(0, [voice.lastNote, 0, 1 + i]);
            var newNote = generateNextPitch(i);
            voice.direction = sign(newNote, voice.lastNote);
            voice.lastNote = newNote;
            outlet(0, [voice.lastNote, 60, 0]);
            outlet(0, [voice.lastNote, 60, 1 + i]);
            voice.len = voice.durs.get(cnt)
        }

    }
    cnt++;
}


function setScale(value) {
    scale = value*7%12;
    log(generateModeFromSteps(0, scale))
}


function generateModeFromSteps(root, mode) {
    // Define the step pattern of the major scale (Ionian mode)
    var stepPattern = [2, 2, 1, 2, 2, 2, 1]; // Whole, Whole, Half, Whole, Whole, Whole, Half

    // Function to rotate the step pattern to generate other modes
    function rotatePattern(pattern, steps) {
        return pattern.slice(steps).concat(pattern.slice(0, steps));
    }

    // Rotate the step pattern based on the mode index (0 for Ionian, 1 for Dorian, etc.)
    var modePattern = rotatePattern(stepPattern, mode);
    modePattern.pop();
    // Generate the notes for the mode starting from the root note
    var modeNotes = [root]; // Start with the root note

    var currentNote = root;


    for (var i = 0; i < modePattern.length; i++) {
        var step = modePattern[i];
        currentNote = (currentNote + step) % 12; // Move by step (either whole or half), mod 12 for octave
        modeNotes.push(currentNote);
    }
    return modeNotes;
}

function setVoiceLen(v1, v2, v3, v4) {
    log(v1, v2, v3, v4);
    voices[0].len = v1;
    voices[1].len = v2;
    voices[2].len = v3;
    voices[3].len = v4;
}

function generateNewRythm() {
    voices[0].durs = generateSumArray(PL, [1, 2, 3, 4, 5, 6]);
    voices[1].durs = generateSumArray(PL, [1, 2, 3, 4, 5, 6]);
    voices[2].durs = generateSumArray(PL, [1, 2, 3, 4, 5, 6]);
    voices[3].durs = generateSumArray(PL, [1, 2, 3, 4, 5, 6]);
}

function setVoiceNote(v1, v2, v3, v4) {
    voices[0].baseNote = v1;
    voices[1].baseNote = v2;
    voices[2].baseNote = v3;
    voices[3].baseNote = v4;
}

Array.prototype.get = function (i) {
    return this[mod(i, this.length)];
}

function mod(x, m) {
    return (x % m + m) % m;
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}


function getScale() {
    return [0, 2, 4, 5, 7, 9, 11];
}


function getNoteCost(prevPitch, candidatePitch, otherNotes, baseNote) {
    var cost = 0;
    var baseDif = Math.abs(candidatePitch - baseNote);

    if (baseDif > 8) {
        cost += baseDif;
    }
    var interval = Math.abs(candidatePitch - prevPitch);


    if (interval > 3)
        cost += interval;
    // Penalize same note
    if (candidatePitch === prevPitch) cost += 1000;

    // Voice collision/dissonance
    var generalDirection = 0;
    for (var i = 0; i < otherNotes.length; i++) {
        var other = otherNotes[i].lastNote;
        if (other === candidatePitch) cost += 1000;
        var diff = Math.abs(other - candidatePitch) % 12;
        if (Math.abs(other - candidatePitch) < diff) {
            diff = Math.abs(other - candidatePitch);
        }
        if (diff === 1 || diff === 6) cost += 200;
        if (diff === 2 || diff === 8) cost += 100;
        generalDirection += otherNotes[i].direction;

    }


    if (generalDirection > 0 && candidatePitch > prevPitch) {
        cost += 10;
    }
    if (generalDirection < 0 && candidatePitch < prevPitch) {
        cost += 10;
    }

    return cost;
}

function genScale(scale, centerOctave) {
    var ar = [];
    for (var i = centerOctave - 1; i <= centerOctave + 1; i++) {

        for (var j = 0; j < scale.length; j++) {
            var note = scale[j] + 12 * i;
            if (note > 0 && note < 127)
                ar.push(note);
        }
    }
    return ar;
}

var root = 0;


function setRoot(val) {
    root = val;
    log("root:", root)
}

function getSchillingScale() {
    var bar = Math.floor(cnt / 4);

    if (bar % PL === 0 || bar % PL - 1 === 0) {
        return [0, 2, 4].map(function (struct) {
            return scaleComputed.get(struct + srm.get(bar));
        })
    }
    return [
        [0, 2, 4],
        [0, 2, 4, 6],
        [0, 2, 4, 6, 8],
        [0, 2, 4, 6, 8, 10],
    ].get(root).map(function (struct) {
        return scaleComputed.get(struct + srm.get(bar));
    })

}

function generateNextPitch(trackIndex) {
    var track = voices[trackIndex];
    var prevPitch = track.lastNote;
    var sc = getSchillingScale();

    var scale = genScale(sc, Math.round(prevPitch / 12));

    var otherNotes = voices.filter(function (n) {
        return n.voice != trackIndex;
    });

    var bestPitch = scale[0];
    var bestCost = Infinity;


    for (var i = 0; i < scale.length; i++) {
        var pitch = scale[i];
        var cost = getNoteCost(prevPitch, pitch, otherNotes, track.baseNote);
        if (cost < bestCost) {
            bestCost = cost;
            bestPitch = pitch;
        }
    }

    for (var i = 0; i < otherNotes; i++) {
        if (otherNotes[i].pitch === bestPitch) {
            post("error")
        }
    }

    return bestPitch;
}


