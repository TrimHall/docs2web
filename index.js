var app = angular.module("Website_App", ["ngSanitize"]);
var scope = null;
var http = null;
app.controller("Website_Controller", function ($scope, $http) {
  scope = $scope;
  http = $http;
  var loadUrl = false;
  if (config.url != null) {
    config.url = config.url + "?embedded=true";
  }
  if (window.location.hash) {
    var params = getHashParams();
    if (params.hasOwnProperty("id")) {
      config.url =
        "https://docs.google.com/document/d/e/" +
        params["id"] +
        "/pub?embedded=true";
    } else if (params.hasOwnProperty("url")) {
      config.url = params["url"] + "?embedded=true";
    }
  }
  if (config.url == null) {
    $("#instructions").removeClass("Hidden");
  } else {
    $("#instructions").addClass("Hidden");
    loadUrl = true;
  }
  if (loadUrl) {
    $http.get(config.url).success(function (response) {
      var data = formatContent(response);

      // filter the data for any sections that do not have a title
      $scope.data = {
        ...data,
        sections: data.sections.filter((section) => {
          return section.title.trim();
        }),
      };

      $(".Section").addClass("Hidden");
      $(".Index_Section").removeClass("Hidden");
    });
  }
});

$(() => {
  let sectionId = null;
  let nextSectionId = null;
  $(document).on("click", ".Section_Link", (element) => {
    sectionId = element.target.id.split("_").pop();
    $(".Section").addClass("Hidden");
    $("#section_" + sectionId).removeClass("Hidden");
  });
  $(document).on("click", ".Home", (element) => {
    $(".Section").addClass("Hidden");
    $(".Index_Section").removeClass("Hidden");
  });
  $(document).on("click", ".Back", (element) => {
    nextSectionId = (parseInt(sectionId) - 1).toString();
    if (nextSectionId < 0) {
      $(".Section").addClass("Hidden");
      $(".Index_Section").removeClass("Hidden");
    } else {
      $(".Section").addClass("Hidden");
      $("#section_" + nextSectionId).removeClass("Hidden");
      sectionId = nextSectionId;
    }
  });
  $(document).on("click", ".Next", (element) => {
    nextSectionId = (parseInt(sectionId) + 1).toString();
    if (nextSectionId > scope.data.sections.length - 1) {
      $(".Section").addClass("Hidden");
      $(".Index_Section").removeClass("Hidden");
    } else {
      $(".Section").addClass("Hidden");
      $("#section_" + nextSectionId).removeClass("Hidden");
      sectionId = nextSectionId;
    }
  });
  $("#generate").on("click", (element) => {
    var url = $("#urlBox").val();
    window.location.href += "#url=" + url;
    location.reload();
  });
});

function convertToHTML(elements) {
  var html = $("<div/>").append(elements).html();
  return html;
}

function reformatContent(container) {
  $(container + " a").each((_index, element) => {
    var url = $(element).attr("href");
    if (url) {
      var reg = /https:\/\/www.google.com\/url\?q=(.*)&sa=(.*)/g;
      url = url.replace(reg, "$1");
      $(element).attr("href", url);
      $(element).attr("target", "_blank");
    }
  });

  $(container + " ul").each((index, element) => {
    var classes = $(element).attr("class");
    if (classes.indexOf("-0") != -1) {
      $(element).find("li").addClass("Level_0");
    } else if (classes.indexOf("-1") != -1) {
      $(element).find("li").addClass("Level_1");
    } else if (classes.indexOf("-2") != -1) {
      $(element).find("li").addClass("Level_2");
    } else if (classes.indexOf("-3") != -1) {
      $(element).find("li").addClass("Level_3");
    } else if (classes.indexOf("-4") != -1) {
      $(element).find("li").addClass("Level_4");
    } else if (classes.indexOf("-5") != -1) {
      $(element).find("li").addClass("Level_5");
    }
  });
}

function getHashParams() {
  var hashParams = {};
  var e,
    a = /\+/g, // Regex for replacing addition symbol with a space
    r = /([^&;=]+)=?([^&;]*)/g,
    d = function (s) {
      return decodeURIComponent(s.replace(a, " "));
    },
    q = window.location.hash.substring(1);
  while ((e = r.exec(q))) hashParams[d(e[1])] = d(e[2]);
  return hashParams;
}

function formatContent(response) {
  var content = {};
  var container = "#temp";
  $(container).html(response);
  reformatContent(container);
  content.title = $(container + " .title").text();
  content.sections = [];
  var sections = $(container + " h1").toArray();
  for (var i = 0; i < sections.length; i++) {
    content.sections[i] = {};
    content.sections[i].title = $(sections[i]).text();
    content.sections[i].sections = [];
    if (i == sections.length - 1) {
      content.sections[i].contentAll = $(sections[i]).nextAll();
    } else {
      content.sections[i].contentAll = $(sections[i]).nextUntil(
        sections[i + 1]
      );
    }
    var subSections = content.sections[i].contentAll.filter("h2").toArray();
    if (subSections.length > 0) {
      content.sections[i].content = convertToHTML(
        $(sections[i]).nextUntil(subSections[0])
      );
    } else {
      content.sections[i].content = convertToHTML(
        content.sections[i].contentAll
      );
    }
    for (var j = 0; j < subSections.length; j++) {
      content.sections[i].sections[j] = {};
      content.sections[i].sections[j].title = $(subSections[j]).text();
      content.sections[i].sections[j].sections = [];
      if (j == subSections.length - 1) {
        if (i == sections.length - 1) {
          content.sections[i].sections[j].content = convertToHTML(
            $(subSections[j]).nextAll()
          );
        } else {
          content.sections[i].sections[j].content = convertToHTML(
            $(subSections[j]).nextUntil(sections[i + 1])
          );
        }
      } else {
        content.sections[i].sections[j].content = convertToHTML(
          $(subSections[j]).nextUntil(subSections[j + 1])
        );
      }
    }
  }
  $(container).html("");
  return content;
}
