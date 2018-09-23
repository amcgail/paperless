from django.shortcuts import render
from django.http import response

# Create your views here.
def sjson(arg):
    from bson import json_util
    import json

    return json.dumps(arg, default=json_util.default)

from paperless.env import papers, tagSentences

from django.template.loader import render_to_string
from bson.objectid import ObjectId

def gui(request):
    tags = papers.distinct("tags")
    return response.HttpResponse(render_to_string('browser/main.html', {"autocomplete_tags":sjson(tags)}))

def ingest(request):
    from _scripts import imp
    return response.HttpResponse(imp.importImagesFromFlash())

def byTag(request):
    import json

    tags_q = json.loads( request.POST['tags'] )
    filter = {
        "status": {"$ne": "trashed"}
    }
    if len(tags_q) > 0:
        filter['tags'] = {"$all": tags_q}

    result = papers.find(filter)

    images = list(result.clone())

    for i, r in enumerate(images):
        fw = r['file'].split("/")[-1]
        fw = "/static/%s" % fw
        images[i]['file_web'] = fw

    other_tags = result.clone().distinct("tags")

    return response.HttpResponse(sjson({
        "images":images,
        "other_tags":other_tags
    }))

def topLevel(request):
    tags = papers.distinct("tags",{})

    tags_inside_other_tags = tagSentences.distinct("tag2", {"verb":"contains"})
    tags_not_inside_other_tags = [x for x in tags if x not in tags_inside_other_tags]

    return response.HttpResponse(sjson(tags_not_inside_other_tags))

def tagsInMe(request):
    result = tagSentences.find({
        "tag1":ObjectId(request.POST['me']),
        "verb":"contains"
    })
    result = [x['tag2'] for x in result]
    return response.HttpResponse(sjson(result))

def removeTag(request):
    p = papers.find_one({
        "_id": ObjectId(request.POST['id'])
    })
    if p is None:
        return response.Http404()

    newTags = [ x for x in p['tags'] if x != request.POST['tag'] ]
    print newTags
    papers.update_one({
        "_id": ObjectId(request.POST['id'])
    }, {
        "$set":{"tags": newTags}
    })
    return response.HttpResponse(1)