import { Shuffle } from "./shuffle.js";
import { TileMatrix } from "./tileMatrix.js";


/**
 * @author sakaijun
 * 
 * + every image will be displayed by standard resolution modes WxH dependent on browser window size
 * + (re)calculate height with ratio of width
 * + slice in rows and cols (rectangular too)
 * + add borders
 * + shuffle positions of sliced image
 * + assign listener to every tile
 * + swap css properties, when a tile is clicked next to gap (diff is always 1)
 * + mark gap
 *   
 */

export class Controller {

    constructor() {
        this.btnListener();
        this.tileLock = false;
        $(".puzzle").before('<canvas id ="cssContent" width="1024px" height="1024px"></canvas>');
        this.resizeListener();
        this.utfBlockListener();
        this.rangeListener();
        //this.initRaster();
        this.keyListener();
        this.aniSpeed();
        let imgArr = ["./images/starpoly13.gif", "./images/IMG_0536.JPG", "./images/IMG_0548.JPG", "./images/IMG_0556.JPG"];
        let rnd = Math.floor(Math.random() * imgArr.length);      
        let previewImg = new Image();
        previewImg.src = imgArr[rnd];
        this.img = previewImg;
        this.sliceImg(false, true);
        previewImg.onload = (e) => {       
            this.img = previewImg;
            this.sliceImg(false, true);
        }       
    }

    keyListener() {
        $("#utfFromTo").on("keydown", (e) => {
            if (e.keyCode === 13) {
                this.initRaster();
            }
        });
    }

    initRaster() {
        let block = this.utfSelect();
        let codePoint = block.from + Math.floor(Math.random() * block.len);
        $("#cssContent").attr("content", String.fromCodePoint(codePoint));
        this.loadRaster(block);
        this.utfRasterListener();
        this.unicodeLoader(codePoint);
    }

    utfBlockListener() {
        $(".loadUtf").on("click", () => {
            let block = this.utfSelect();
            $("#uc").attr("min", block.from);
            $("#uc").attr("max", block.to);
            $("#uc").attr("value", block.from);
            $("#utfRaster").css({ "display": "block" });
            this.loadRaster(block);
            this.utfRasterListener();
        });
    
    }

   

    utfRasterListener() {
        $(".icon").on("click", (e) => {
            let codePoint = parseInt($(e.target).attr("value"));
            $("#cssContent").attr("content", String.fromCodePoint(codePoint));
            this.unicodeLoader(codePoint);
        });

    }

    unicodeLoader(codePoint) {
        var imgCtx = document.getElementById('cssContent').getContext('2d');
        imgCtx.clearRect(0, 0, 1024, 1024);
        imgCtx.font = "1024px serif";
        imgCtx.fillText(String.fromCodePoint(codePoint), 0, 895);
        let previewImg = new Image();
        previewImg.src = imgCtx.canvas.toDataURL();
        previewImg.onload = (e) => {
            this.img = previewImg;
            this.sliceImg(false, true);

        }
    }

    resizeListener() {
        $(window).resize(() => {
            this.resizePuzzle();
        });
    }

    rangeListener() {
        $(".option").on("input", (e) => {
            let font;
            let ucode = $("#uc").val();
            font = ($("#sans").prop('checked')) ? "serif" : "sans-serif";
            $("#cssContent").css("font-family", font);
            $("#cssContent").attr("content", String.fromCodePoint(ucode));
        });
    }


    utfSelect() {

        let userRange = $("#utfFromTo").val().split("-");
        let utfRange = {
            from: Number(`0x${userRange[0]}`),
            to: Number(`0x${userRange[1]}`),
            len: Number(`0x${userRange[1]}`) - Number(`0x${userRange[0]}`)
        }
        let selection = $("input:radio[class='utfBlk']:checked").attr("id");
        let utfBlock = {};

        try {
            if (isNaN(parseInt(utfRange.from, 16)) || isNaN(parseInt(utfRange.to, 16))) {
                throw "Not a valid unicode hex-range";
            } else {
                utfBlock = utfRange;
            }
        } catch (error) {
            console.log(error)
        }

        return utfBlock;
    }

    loadRaster(block) {
        $("#utfRaster").remove();
        $("<div id='utfRaster'></div>").insertAfter(".puzzle");
        for (let i = block.from; i <= block.to; i++) {
            $("#utfRaster").append(`<span class="icon" title="${i.toString(16).toUpperCase()}" value=${i}>${String.fromCodePoint(i)}\u2000</span>`);
        }
    }

    get row() {
        return $("#row").val();
    }

    get col() {
        return $("#col").val();
    }

    set img(pic) {
        this.pic = pic;
    }

    get img() {
        return this.pic;
    }

    get tile() {
        return document.body.querySelectorAll('.tile');
    }

    btnListener() {

        $(".MxN").on("click input", () => {
            $("#info").html("");
            this.sliceImg(false, true);
        });

        $("#undo").on("click", () => {
            $("#info").html("");
            this.sliceImg(false, true);
            $(".tile").off("click");
        });

        $("#rnd").on("click", () => {
            $("#info").html("");
            $("#utfRaster").css({ "display": "none" });
            this.sliceImg(true, false);
        });

        $("#readFile").on('change', () => {
            this.previewFile((res) => {
                this.img = res;
                $("#utfRaster").css({ "display": "none" });
                this.sliceImg(false, true);
            });
        });

        $("#ani").on("click", () => {
            this.aniSpeed();
        });
    }

    aniSpeed() {
        ($("#ani").prop('checked')) ? $(".speed").attr("disabled", false) : $(".speed").attr("disabled", true);
    }

    //assign listener to every tile, swapping is only allowed when the next one is a gap
    tileListener() {
        $(".tile").on("click", (e) => {
            let curr = e.currentTarget.id;
            let coordClick = curr.split("");
            let clickX = coordClick[0];
            let clickY = coordClick[1];
            let gapX = 0;
            let gapY = 0;
            let coordGap = [];
            for (let i = 0; i < this.tile.length; i++) {
                if ($(this.tile[i]).attr("value") === "gap") {
                    coordGap = this.tile[i].id.split("");
                    gapX = coordGap[0];
                    gapY = coordGap[1];
                    let abs = this.dist(clickX, clickY, gapX, gapY)
                    if (abs.absDist == 1) {
                        this.tileAnimate(this.tile[i].id, curr, abs.direction);
                    }
                }
            }
        });
    }
    //check if all tiles placed right
    evaluate(tile) {
        let tileLen = $("#row").val() * $("#col").val();
        let placedRight = 0;
        for (let j = 0; j < tile.length; j++) {
            if (`tile t${j}` === tile[j].className) {
                placedRight++;
                if (tileLen - 1 == placedRight) {
                    $("#info").html("Solved!");
                    $(`.tile.t${tileLen - 1}`).css({ "opacity": 1 });
                    $(".tile").off("click");
                }
            }
        }
    }
    //upload a jpeg image (optional)
    previewFile(cb) {
        var file = document.querySelector('input[type=file]').files[0];
        let reader = new FileReader();
        try {
            if (file.type == 'image/jpeg' || file.type == "image/gif" || file.type == "image/png" || file.type == "image/tiff") {
                reader.onload = function () {
                    let img = new Image();
                    img.src = reader.result;
                    img.onload = function () {
                        cb(img);
                    }
                }
            } else {
                throw "not an image file";
            }
            if (file) {
                reader.readAsDataURL(file);
            }
        } catch (error) {
            console.log(error);
        }
    }

    //resolution modes dependent on screen size
    resMode() {
        var width = 0

        if (window.innerWidth >= 1920) {
            width = 1680;
        } else if (window.innerWidth >= 1680) {
            width = 1280;
        } else if (window.innerWidth >= 1280) {
            width = 1024;
        } else if (window.innerWidth >= 1024) {
            width = 800;
        } else if (window.innerWidth >= 800) {
            width = 640;
        } else if (window.innerWidth >= 640) {
            width = 480;
        } else {
            width = 320;
        }
        //if landscape and square format, resize to 75%
        if (window.innerWidth > window.innerHeight && this.img.width === this.img.height) {
            width = width * 3 / 4;
        }
        return width;
    }

    //called by resizeListener
    resizePuzzle() {
        var tWidth = 0;
        var tNo = 0;
        var tHeight = 0;
        var width = this.resMode();
        var ratio = this.img.width / width;
        var height = this.img.height / ratio;
        this.puzzleTileSize(width, height);

        for (var i = 0; i < this.row; i++) {
            tWidth = 0;
            for (var j = 0; j < this.col; j++) {
                $(`.tile.t${tNo}`).css({
                    "background-position": `${Math.floor(tWidth)}px ${Math.floor(tHeight)}px`
                });
                tWidth -= (width / this.col);
                tNo++;
            }
            tHeight -= (height / this.row);
        }
    }

    sliceImg(rnd, lastTile) {
        let tm = new TileMatrix();
        let arr = tm.createTileMat(this.row, this.col);
        let shuffle = new Shuffle();
        let shuffled = shuffle.randomOrder(arr, rnd);
        $("#dimInfo").html(`Format: ${this.row}x${this.col}`);
        var width = this.resMode()
        var ratio = this.img.width / width;
        var height = this.img.height / ratio;
        this.buildTile(width, height, shuffled, lastTile);
        this.tileListener();
    }

    //build Tiles of an image, the last one is always marked as "gap"
    buildTile(width, height, shuffled, lastTile) {
        let k = 0;
        var tNo = 0;
        var tWidth = 0;
        var tHeight = 0;
        var tileSet = "";
        for (let i = 0; i < this.row; i++) {
            for (let j = 0; j < this.col; j++) {
                tileSet += `<div class="tile t${shuffled[k] - 1}" id="${i}${j}"></div>`;
                k++;
            }
        }
        $(".puzzle").html(tileSet);
        this.puzzleTileSize(width, height);
        for (var i = 0; i < this.row; i++) {
            tWidth = 0;
            for (var j = 0; j < this.col; j++) {
                $(`.tile.t${tNo}`).css({
                    "background-position": `${Math.floor(tWidth)}px ${Math.floor(tHeight)}px`
                });
                $(`.tile.t${tNo}`).attr("value", "");
                tWidth -= (width / this.col);
                tNo++;
            }
            tHeight -= (height / this.row);
        }
        if (!lastTile) {
            $(`.tile.t${this.row * this.col - 1}`).css({ "opacity": 0 });
            $(`.tile.t${this.row * this.col - 1}`).attr("value", "gap");
        }
    }

    puzzleTileSize(width, height) {
        $(".puzzle").css({
            "position": "relative",
            "width": `${width}px`,
            "height": `${height}px`,
            "left": "50%",
            "transform": "translateX(-50%)"
        });
        $('.tile').css({
            "width": `${Math.floor(width / this.col)}px`,
            "height": `${Math.floor(height / this.row)}px`,
            "float": "left",
            "position": "relative",
            "background-image": `url(${this.img.src})`,
            "background-size": `${width}px ${height}px`
        });
    }

    //animate every tile related to direction (lock tiles), swap after completion (unlock tiles)   
    tileAnimate(last, curr, direction) {
        let wh = (direction == "top" || direction == "bottom") ? $(`#${curr}`).css("height") : $(`#${curr}`).css("width");
        jQuery.fx.off = !$('#ani').prop('checked');
        if (!this.tileLock) {
            this.tileLock = true;
            $(`#${curr}`).animate(JSON.parse(`{"${direction}": "-${wh}"}`), {
                duration: $("input:radio[class='speed']:checked").val(),
                complete: () => {
                    $(`#${curr}`).css(JSON.parse(`{"${direction}": ""}`));
                    $(`#${curr}`).after(() => {
                        this.swapTile(last, curr);
                        this.tileLock = false;
                        this.evaluate(this.tile);
                    });
                }
            });
        }
    }

    //swap css properties of two tiles, the neighbour is always empty
    swapTile(last, curr) {
        let gap = $(`#${last}`).css("background-position");
        let clicked = $(`#${curr}`).css("background-position");
        let classTemp = $(`#${curr}`).attr("class");
        $(`#${curr}`).css({
            "opacity": 0,
            "background-position": gap
        });
        $(`#${curr}`).attr("value", "gap");
        $(`#${curr}`).attr("class", $(`#${last}`).attr("class"));
        $(`#${last}`).css({ "background-position": clicked, "opacity": 1 });
        $(`#${last}`).attr("value", "");
        $(`#${last}`).attr("class", classTemp);
    }

    //return absolute distance, direction
    dist(x1, y1, x2, y2) {
        let distProp = {
            direction: "",
            absDist: 0
        }
        if ((x1 - x2) === 1) {
            distProp.direction = "top";
        } else if ((x1 - x2) === -1) {
            distProp.direction = "bottom";
        } else if ((y1 - y2) === 1) {
            distProp.direction = "left";
        } else {
            distProp.direction = "right";
        }
        distProp.absDist = Math.abs(x1 - x2) + Math.abs(y1 - y2);

        return distProp;
    }
}