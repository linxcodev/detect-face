const imageUpload = document.getElementById('imageUpload')

Promise.all([
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(start)

async function start() {
    let image, canvas
    const container = document.createElement('div')
    container.style.position = 'relative'

    document.body.append(container)
    const labeledFaceDescriptors = await loadLabeledImages()
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)
    document.body.append('Loaded')

    // image upload event
    imageUpload.addEventListener('change', async () => {
        if (image) image.remove()
        if (canvas) canvas.remove()

        image = await faceapi.bufferToImage(imageUpload.files[0])
        container.append(image)

        canvas = faceapi.createCanvasFromMedia(image)
        container.append(canvas)

        const displaySize = { width: image.width, height: image.height }
        faceapi.matchDimensions(canvas, displaySize)

        // detect all face = detectAllFace
        // detect single face = detectSingleFace
        const detection = await faceapi.detectSingleFace(image).withFaceLandmarks().withFaceDescriptor()
        console.log('detection', detection);

        const resizedDetections = faceapi.resizeResults(detection, displaySize)
        console.log(resizedDetections);

        // face all
        // const result = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
        const result = faceMatcher.findBestMatch(resizedDetections.descriptor)
        console.log(result);

        if (result._label == 'unknown') {
            alert('Wajah belum didaftarkan')
            return
        }

        const box = resizedDetections.detection.box
        console.log(result._label);
        const drawBox = new faceapi.draw.DrawBox(box, { label: result._label })
        drawBox.draw(canvas)
        
        // all face
        // result.forEach((result, i) => {
        //     const box = resizedDetections[i].detection.box
        //     console.log(result._label);
        //     const drawBox = new faceapi.draw.DrawBox(box, { label: result._label })
        //     drawBox.draw(canvas)
        // })
    })
}

function loadLabeledImages() {
    const labels = ['Black Widow', 'Captain America', 'Captain Marvel', 'Hawkeye', 'Jim Rhodes', 'Thor', 'Tony Stark']
    return Promise.all(
        labels.map(async label => {
            const descriptions = []

            for (let i = 1; i < 2; i++) {
                const img = await faceapi.fetchImage(`./labeled_images/${label}/${i}.jpg`)
                const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()

                descriptions.push(detections.descriptor)
            }

            return new faceapi.LabeledFaceDescriptors(label, descriptions)
        })
    )
}