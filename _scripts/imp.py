
def detectNewImageFilesAndAdd():
    from paperless.env import imageStorageDirectory, papers
    import datetime
    import os

    imagesWeHave = os.listdir(imageStorageDirectory)
    databaseEntriesWeHave = [ x['file'] for x in papers.find() ]

    now_dt = datetime.datetime.now()

    for x in imagesWeHave:
        if x in databaseEntriesWeHave:
            continue

        papers.insert({
            "file": x,
            "status": "new",
            "timeUploaded": now_dt,
            "tags": ["recentlyIngested"]
        })
        print "Inserted 1!"

def importImagesFromFlash():
    from wand.image import Image

    import shutil
    import glob

    import datetime, time
    import pymongo
    from paperless.env import papers

    import os
    from paperless.env import imageStorageDirectory, inboxDirectory, flashDirectories

    ret = ""

    inbox = sorted(os.listdir(inboxDirectory))
    for fn in inbox:
        path_join = os.path.join(inboxDirectory, fn)
        ret += "Processing %s" % path_join

        im = Image(filename=path_join)
        now_str = str(time.time())
        now_dt = datetime.datetime.now()

        for i, page in enumerate(im.sequence):
            newfn = "{now_str}.{i}.png".format(**locals())
            newfn = os.path.join(imageStorageDirectory, newfn)

            with Image(page) as page_im:
                page_im.save(filename=newfn)
                papers.insert({
                    "file": newfn,
                    "status": "new",
                    "timeUploaded": now_dt,
                    "tags": ["recentlyIngested"]
                })

        ret += "Removing %s" % path_join
        os.remove(path_join)

    ret += "%s PDFs processed..." % len(inbox)

    for flashdir in flashDirectories:
        if os.path.exists(flashdir):
            ret += "Flash drive %s detected. Copying PDFs to Inbox" % flashdir

            files = glob.glob("%s/*" % flashdir)
            for fn in files:
                ret += "Moving %s" % fn
                shutil.move(fn, inboxDirectory)

            ret += "%s PDFs copied" % len(files)

    return ret