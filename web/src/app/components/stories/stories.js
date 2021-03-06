angular
  .module('app')
  .controller('StoriesController', StoriesController)


function StoriesController($rootScope, $scope, $sce, Agent, AgentStories, Intents, AgentEntities, AgentActions) {
  $scope.graphData = "";

  var simplemde = new SimpleMDE({
    element: $("#MyID")[0],
    toolbar: [{
      name: "heading2",
      action: SimpleMDE.toggleHeading2,
      className: "fa fa-header",
      title: "Heading2",
    },
    {
      name: "unorderedlist",
      action: SimpleMDE.toggleUnorderedList,
      className: "fa fa-list-ul",
      title: "Generic List",
    }, "|",
    {
      name: "preview",
      action: SimpleMDE.togglePreview,
      className: "fa fa-eye no-disable",
      title: "Toggle Preview",
    },
  //Story Visualization
		/*{
			name: "flowchart",
			action: function customFunction(editor){
				processDataForVisual(simplemde.value());
			},
			className: "fa fa-connectdevelop",
			title: "Visualize (Flowchart view)",
		},*/"|",
    {
      name: "save",
      action: function customFunction(editor) {
        var formdata = {};
        formdata.story_details = simplemde.value();
        formdata.agent_id = $scope.agent.agent_id;
        AgentStories.save(formdata).$promise.then(function (resp) {
          $rootScope.$broadcast('setAlertText', "Stories Added to the Agent Sucessfully!!");
          $scope.go('/agent/' + $scope.$routeParams.agent_id);
        });
      },
      className: "fa fa-save",
      title: "Save",
    }
    ]
  });

  Agent.get({ agent_id: $scope.$routeParams.agent_id }, function (data) {
    $scope.agent = data;
    simplemde.value(data.story_details);
  });
  Intents.query({ agent_id: $scope.$routeParams.agent_id }, function (data) {
    $scope.intentList = data;
  });

  AgentEntities.query({ agent_id: $scope.$routeParams.agent_id }, function (data) {
    $scope.entitiesList = data;
  });

  AgentActions.query({ agent_id: $scope.$routeParams.agent_id }, function (data) {
    $scope.actionsList = data;
  });

  function processDataForVisual(mdData) {
    var lines = mdData.split("\n");
    var graphArr = [];
    var storyFlow = "";
    var story_line_count = 0;
    for (var i = 0; i < lines.length; i++) {
      var currentLine = lines[i];
      if (currentLine.startsWith("##")) {
        //got a new story.
        //push the old story if there is one.
        if (storyFlow.length > 0) {
          storyFlow = storyFlow.substring(0, storyFlow.lastIndexOf(';') + 1);
          graphArr.push(storyFlow);
          storyFlow = "";
          story_line_count = 0;
        }
        continue;
      } else if (currentLine.startsWith("*")) {
        //story:intent {entities}
        var currentIntent, entities = "";
        if (currentLine.indexOf("{") != -1) {
          //contains entities
          currentIntent = currentLine.substring(2, currentLine.indexOf("{"));
          entities = currentLine.substring(currentLine.indexOf("{"), currentLine.indexOf("}"));
        } else {
          currentIntent = currentLine.substring(2, currentLine.length)
        }
        if (story_line_count != 0) {
          //first action for the story
          storyFlow = storyFlow + currentIntent + ";";
        }
        storyFlow = storyFlow + currentIntent + "-->";
      } else if (currentLine.startsWith("\t-") || currentLine.startsWith("  -")) {
        //story:intent:action
        storyFlow = storyFlow + currentLine.substring(currentLine.indexOf("-") + 2, currentLine.length) + "((" + currentLine.substring(currentLine.indexOf("-") + 2, currentLine.length) + "));";
        storyFlow = storyFlow + currentLine.substring(currentLine.indexOf("-") + 2, currentLine.length) + "-->";
      }
      story_line_count++;
    }
    //process last story
    storyFlow = storyFlow.substring(0, storyFlow.lastIndexOf(';') + 1);
    graphArr.push(storyFlow);
    storyFlow = "";

    $scope.graphData = "graph TD;" + graphArr.join("");
  }

  $scope.getGraph = function () {
    if ($scope.graphData.length > 0) {
      setTimeout(function () { mermaid.init(); }, 2000)
      console.log($scope.graphData);
      return $sce.trustAsHtml($scope.graphData);
    } else {
      return "";
    }
  }
}
