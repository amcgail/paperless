from django.shortcuts import render
from django.http import response

# Create your views here.
def sjson(arg):
    from bson import json_util
    import json

    return json.dumps(arg, default=json_util.default)

from paperless.env import papers

from django.template.loader import render_to_string
from bson.objectid import ObjectId

def gui(request):
    tags = papers.distinct("tags")
    return response.HttpResponse(render_to_string('ingest/main.html', {"autocomplete_tags":sjson(tags)}))


def next_inbox(request):
    mynew = papers.find_one({"status": "new"}, sort=[("file", 1)])

    if mynew is None:
        resp = {
            "status": "FAIL"
        }
    else:
        fw = mynew['file'].split("/")[-1]
        fw = "/static/%s" % fw
        mynew['file_web'] = fw

        resp = {
            "status": "OK",
            "result": mynew
        }
    return response.HttpResponse( sjson(resp) )

def tag(request):
    papers.update(
        {"_id": ObjectId(request.POST['id'])},
        {'$push': {'tags': request.POST['tag']}}
    )
    return response.HttpResponse("1")


def rotate(request):
    myim = papers.find_one({"_id": ObjectId(request.POST['id'])})

    from PIL import Image
    import os
    from paperless import env
    fn = os.path.join( env.imageStorageDirectory, myim['file'])
    f = Image.open(fn)
    f = f.rotate(180)
    f.save(fn)

    return response.HttpResponse( myim['file'] + "," + request.POST['id'])

def trash(request):
    papers.update(
        {"_id": ObjectId(request.POST['id'])},
        {'$set': {'status': 'trashed'}}
    )
    return response.HttpResponse("1")

def done(request):
    papers.update(
        {"_id": ObjectId(request.POST['id'])},
        {'$set': {'status': 'ingested'}}
    )
    return response.HttpResponse("1")
