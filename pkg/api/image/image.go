package image

import (
	"archive/zip"
	"bytes"
	"fmt"
	"github.com/Behemoth11/awaken-email-service/pkg/api/custom_error"
	"github.com/Behemoth11/awaken-email-service/pkg/api/image/manipulations"
	"github.com/gin-gonic/gin"
	"image"
	"image/jpeg"
	"io/ioutil"
	"path/filepath"
)

// NewService : Creates an image service
func NewService() Service {
	return Service{}
}

type Service struct{}

func (service Service) RegisterRoutes(routerGroup *gin.RouterGroup) {
	routerGroup.POST("/", handlePost)
}

// handlePost : handles post requests
func handlePost(context *gin.Context) {
	zipBuffer := new(bytes.Buffer)

	file, header, err := context.Request.FormFile("upload")

	if err != nil {
		context.Error(custom_error.BadRequestError("Request did not contain any file"))
		return
	}

	originalImage, _, err := image.Decode(file)

	if err != nil {
		context.Error(err)
	}

	zipWriter := zip.NewWriter(zipBuffer)

	// adding a 200px version to zip
	zipImageVersion(zipWriter, originalImage, 200)

	// adding a 300px version to zip
	zipImageVersion(zipWriter, originalImage, 400)

	// adding a 400px version to zip
	zipImageVersion(zipWriter, originalImage, 700)

	var err_zip = zipWriter.Close()
	if err_zip != nil {
		fmt.Println(err)
	}

	fileName := fileNameWithoutExtSliceNotation(header.Filename) + ".zip"

	ioutil.WriteFile("./static/"+fileName, zipBuffer.Bytes(), 0777)
}

func fileNameWithoutExtSliceNotation(fileName string) string {
	return fileName[:len(fileName)-len(filepath.Ext(fileName))]
}

func zipImageVersion(zipWriter *zip.Writer, image image.Image, width int) {
	// resizing image to specific width
	resizedImage := manipulations.Resize(image, width)

	// write of a jpeg version
	imageJpeg, _ := zipWriter.Create(fmt.Sprintf("%v.jpeg", width))
	jpeg.Encode(imageJpeg, resizedImage, nil)

	// write of a webp version of the image
	imageWebp, _ := zipWriter.Create(fmt.Sprintf("%v.webp", width))
	jpeg.Encode(imageWebp, resizedImage, nil)

}
